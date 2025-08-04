#!/bin/bash
# NAT Instance User Data Script
# Configures Amazon Linux 2 instance as NAT with monitoring

yum update -y

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p

# Configure iptables for NAT
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -A FORWARD -i eth0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i eth0 -o eth0 -j ACCEPT

# Save iptables rules
service iptables save

# Enable iptables service
systemctl enable iptables
systemctl start iptables

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "metrics": {
        "namespace": "ClinicalTrial/NAT",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60,
                "totalcpu": false
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            },
            "netstat": {
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait"
                ],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": [
                    "swap_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${project_name}-nat-instance",
                        "log_stream_name": "{instance_id}/messages"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Create a simple health check script
cat > /usr/local/bin/nat-health-check.sh << 'EOF'
#!/bin/bash
# Simple NAT health check

# Check if IP forwarding is enabled
if [ "$(cat /proc/sys/net/ipv4/ip_forward)" != "1" ]; then
    echo "IP forwarding is disabled" >&2
    exit 1
fi

# Check if iptables NAT rule exists
if ! iptables -t nat -C POSTROUTING -o eth0 -j MASQUERADE 2>/dev/null; then
    echo "NAT iptables rule missing" >&2
    exit 1
fi

# Check internet connectivity
if ! ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "No internet connectivity" >&2
    exit 1
fi

echo "NAT instance is healthy"
exit 0
EOF

chmod +x /usr/local/bin/nat-health-check.sh

# Add health check to crontab (runs every 5 minutes)
echo "*/5 * * * * /usr/local/bin/nat-health-check.sh >> /var/log/nat-health.log 2>&1" | crontab -

# Signal successful completion
/opt/aws/bin/cfn-signal -e $? --stack ${project_name} --resource NatInstance --region ${aws_region} || true

# Log startup completion
echo "NAT instance configuration completed at $(date)" >> /var/log/nat-startup.log