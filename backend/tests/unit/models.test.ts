import { Physician, Patient, ClinicalTrial } from '../../models';
import { testPool } from '../setup';

describe('Database Models', () => {
  let testPhysician: Physician;
  let testPatient: Patient;
  let testTrial: ClinicalTrial;

  beforeAll(async () => {
    // Setup test data
    testPhysician = new Physician({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@hospital.com',
      specialization: 'Cardiology'
    });

    testPatient = new Patient({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      dateOfBirth: new Date('1980-01-01')
    });

    testTrial = new ClinicalTrial({
      title: 'Heart Disease Prevention Study',
      description: 'A comprehensive study on heart disease prevention',
      startDate: new Date(),
      status: 'RECRUITING'
    });
  });

  describe('Physician Model', () => {
    it('should validate physician model', () => {
      expect(testPhysician.firstName).toBe('John');
      expect(testPhysician.lastName).toBe('Doe');
      expect(testPhysician.email).toBe('john.doe@hospital.com');
    });

    it('should require valid email format', () => {
      expect(() => {
        new Physician({
          ...testPhysician,
          email: 'invalid-email'
        });
      }).toThrow();
    });
  });

  describe('Patient Model', () => {
    it('should validate patient model', () => {
      expect(testPatient.firstName).toBe('Jane');
      expect(testPatient.lastName).toBe('Smith');
      expect(testPatient.email).toBe('jane.smith@example.com');
    });

    it('should require date of birth', () => {
      expect(() => {
        new Patient({
          ...testPatient,
          dateOfBirth: undefined
        });
      }).toThrow();
    });
  });

  describe('Clinical Trial Model', () => {
    it('should validate clinical trial model', () => {
      expect(testTrial.title).toBe('Heart Disease Prevention Study');
      expect(testTrial.status).toBe('RECRUITING');
    });

    it('should have valid status values', () => {
      expect(() => {
        new ClinicalTrial({
          ...testTrial,
          status: 'INVALID_STATUS' as any
        });
      }).toThrow();
    });
  });
});