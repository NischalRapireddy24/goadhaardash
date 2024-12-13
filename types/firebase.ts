export interface ImageUpload {
  uri: string;
  type?: string;
  name?: string;
}

export interface FirebaseError {
  code: string;
  message: string;
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AgentData {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  createdAt: any;
  status: 'active' | 'inactive';
}

export interface FarmerData {
  id: string;
  name: string;
  phoneNumber: string;
  aadhaarNumber: string;
  village: string;
  agentId: string;
  photoUrl?: string;
  createdAt: any;
  farmerType: 'Individual' | 'Enterprise';
}

export interface CattleData {
  id: string;
  tagNo: string;
  farmerId: string;
  breed: string;
  age: number;
  weight: number;
  imageUrls?: {
    [key: string]: string;
  };
  createdAt: any;
  registeredBy: string;
  selected?: boolean;
} 