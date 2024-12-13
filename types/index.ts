export interface Agent {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  imageUrl?: string;
}

export interface Stats {
  farmerCount: number;
  cattleCount: number;
  districtStats: {
    [district: string]: {
      cattleCount: number;
      mandals: {
        [mandal: string]: number;
      };
    };
  };
}

export interface FarmerLocation {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  agentName: string;
} 