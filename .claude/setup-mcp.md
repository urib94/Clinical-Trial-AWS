# MCP Tools Setup Guide

## Overview
This guide configures Model Context Protocol (MCP) tools to enhance development productivity for the Clinical Trial Platform.

## Required Environment Variables

Create a `.env` file in the project root with:

```bash
# AWS Configuration
AWS_PROFILE=clinical-trial
AWS_REGION=us-east-1

# Database Configuration  
CLINICAL_TRIAL_DB_URL=postgresql://username:password@localhost:5432/clinical_trial_db

# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO_OWNER=your-organization
GITHUB_REPO_NAME=Clinical-Trial-AWS

# Search Configuration (Optional)
BRAVE_API_KEY=your_brave_search_api_key
```

## Installation Steps

### 1. Copy Claude Desktop Config
Copy the `claude_desktop_config.json` to your Claude Desktop configuration directory:

**Windows:**
```powershell
Copy-Item ".\.claude\claude_desktop_config.json" "$env:APPDATA\Claude\claude_desktop_config.json"
```

**macOS:**
```bash
cp ./.claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Linux:**
```bash
cp ./.claude/claude_desktop_config.json ~/.config/claude/claude_desktop_config.json
```

### 2. Install MCP Servers
The MCP servers will be automatically installed when first used, but you can pre-install them:

```bash
npm install -g @modelcontextprotocol/server-aws
npm install -g @modelcontextprotocol/server-postgres  
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-brave-search
```

### 3. Configure AWS Profile
Set up AWS profile for the clinical trial project:

```bash
aws configure --profile clinical-trial
```

### 4. Test Database Connection
Verify PostgreSQL connection:

```bash
psql $CLINICAL_TRIAL_DB_URL -c "SELECT version();"
```

## Available MCP Tools

### AWS MCP Server
- **Purpose**: Direct AWS service integration
- **Capabilities**: Lambda functions, S3 operations, CloudWatch monitoring
- **Usage**: Deploy infrastructure, manage resources, monitor performance

### PostgreSQL MCP Server  
- **Purpose**: Database operations for Aurora PostgreSQL
- **Capabilities**: Schema management, queries, migrations
- **Usage**: Database setup, testing data, health checks

### GitHub MCP Server
- **Purpose**: Repository and project management
- **Capabilities**: Issues, PRs, workflows, releases
- **Usage**: Code reviews, CI/CD triggers, project tracking

### Memory MCP Server
- **Purpose**: Persistent conversation memory
- **Capabilities**: Remember decisions, configurations, context
- **Usage**: Maintain project context across sessions

### Filesystem MCP Server
- **Purpose**: Enhanced file operations
- **Capabilities**: Advanced file management within project directory
- **Usage**: Code generation, file manipulation, batch operations

### Brave Search MCP Server
- **Purpose**: Web search for development resources
- **Capabilities**: Search for AWS docs, healthcare compliance, libraries
- **Usage**: Research APIs, find solutions, check documentation

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Token Permissions**: Use minimal required GitHub token permissions
3. **AWS Profile**: Use least-privilege IAM roles for development
4. **Database Access**: Use read-only credentials for development queries
5. **File Access**: MCP filesystem server is restricted to project directory

## Troubleshooting

### MCP Server Not Starting
```bash
# Check if Node.js packages are available
npx @modelcontextprotocol/server-aws --version

# Verify environment variables
echo $GITHUB_TOKEN
echo $AWS_PROFILE
```

### Database Connection Issues
```bash
# Test connection manually
psql $CLINICAL_TRIAL_DB_URL -c "\l"

# Check environment variable
echo $CLINICAL_TRIAL_DB_URL
```

### AWS Authentication Issues
```bash
# Verify AWS profile
aws configure list --profile clinical-trial

# Test AWS access
aws sts get-caller-identity --profile clinical-trial
```

## Benefits for Clinical Trial Platform

1. **AWS Integration**: Direct management of Lambda functions, S3 buckets, and monitoring
2. **Database Operations**: Streamlined database schema updates and testing
3. **GitHub Workflow**: Enhanced project management and CI/CD integration  
4. **Persistent Memory**: Maintains context about HIPAA requirements and architectural decisions
5. **Enhanced File Operations**: Efficient code generation and project structure management
6. **Research Capabilities**: Quick access to AWS documentation and healthcare compliance resources

## Next Steps

1. Install and configure the MCP tools following this guide
2. Restart Claude Desktop to load the new configuration
3. Test each MCP server with simple commands
4. Begin using the enhanced capabilities in your development workflow

The MCP tools will significantly enhance productivity by providing direct access to cloud services, databases, and development workflows within Claude conversations.