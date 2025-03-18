declare module '@faceio/fiojs' {
  interface FaceIOConstructor {
    new (publicId: string): FaceIO;
    errCode: {
      FACE_ENROLLMENT_FAILED: string;
      FACE_MISMATCH: string;
      USER_CANCELED: string;
      [key: string]: string;
    };
  }

  interface EnrollmentPayload {
    [key: string]: any;
  }

  interface EnrollmentOptions {
    locale?: string;
    payload?: EnrollmentPayload;
  }

  interface AuthenticationOptions {
    locale?: string;
  }

  interface EnrollmentResponse {
    facialId: string;
    timestamp: string;
    details: {
      [key: string]: any;
    };
  }

  interface AuthenticationResponse {
    facialId: string;
    timestamp: string;
    payload: {
      [key: string]: any;
    };
  }

  interface FaceIO {
    enroll(options: EnrollmentOptions): Promise<EnrollmentResponse>;
    authenticate(options: AuthenticationOptions): Promise<AuthenticationResponse>;
  }

  const faceIO: FaceIOConstructor;
  export default faceIO;
} 