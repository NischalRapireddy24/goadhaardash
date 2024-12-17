import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  DocumentReference,
  deleteDoc,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useState, useCallback } from 'react';

import { db } from '~/utils/firebase';
import { ImageUpload } from '../types';

type FirebaseOperation<T> = (...args: any[]) => Promise<T>;

export function useFirebase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeFirebaseOperation = async <T>(
    operation: FirebaseOperation<T>,
    errorMessage: string,
    ...args: any[]
  ): Promise<T | undefined> => {
    setLoading(true);
    setError(null);
    try {
      return await operation(...args);
    } catch (err) {
      console.error(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (uri: string, path: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, path);
      
      // Upload the image
      await uploadBytes(imageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const uploadMultipleImages = async (
    images: { [key: string]: ImageUpload },
    basePath: string
  ): Promise<{ [key: string]: string }> => {
    const imageUrls: { [key: string]: string } = {};
    
    try {
      const uploadPromises = Object.entries(images).map(async ([key, image]) => {
        if (image?.uri) {
          imageUrls[key] = await uploadImage(image.uri, `${basePath}/${key}`);
        }
      });

      await Promise.all(uploadPromises);
      return imageUrls;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload one or more images');
    }
  };

  const addCattle = useCallback(async (cattleData: any, images: { [key: string]: any }) => {
    return executeFirebaseOperation(async () => {
      const docRef = await addDoc(collection(db, 'cattle'), {
        ...cattleData,
        createdAt: serverTimestamp(),
      });

      const imageUrls: { [key: string]: string } = {};
      
      // Upload each image
      for (const [key, image] of Object.entries(images)) {
        if (image) {
          try {
            imageUrls[key] = await uploadImage(
              image,
              `cattle/${docRef.id}/${key}`
            );
          } catch (error) {
            console.error(`Error uploading ${key} image:`, error);
          }
        }
      }

      // Update document with image URLs if any were uploaded
      if (Object.keys(imageUrls).length > 0) {
        await updateDoc(docRef, { imageUrls });
      }

      return docRef.id;
    }, 'Failed to add cattle');
  }, []);

  const getCattleByFarmer = useCallback(async (farmerId: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(collection(db, 'cattle'), where('farmerId', '==', farmerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }, 'Failed to fetch cattle');
  }, []);

  const getCattleDetails = useCallback(async (cattleId: string) => {
    return executeFirebaseOperation(async () => {
      const docSnap = await getDoc(doc(db, 'cattle', cattleId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      throw new Error('Cattle not found');
    }, 'Failed to fetch cattle details');
  }, []);

  const addInsurance = useCallback(async (cattleId: string, insuranceData: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = doc(db, 'cattle', cattleId);
      await updateDoc(docRef, {
        insurance: { ...insuranceData, createdAt: serverTimestamp() },
      });
    }, 'Failed to add insurance');
  }, []);

  const addHealthRecord = useCallback(async (cattleId: string, healthRecord: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = doc(db, 'cattle', cattleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentRecords = docSnap.data().healthRecords || [];
        await updateDoc(docRef, {
          healthRecords: [...currentRecords, { ...healthRecord, createdAt: serverTimestamp() }],
        });
      } else {
        throw new Error('Cattle not found');
      }
    }, 'Failed to add health record');
  }, []);

  const getHealthCheckupRequests = useCallback(async (village: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(collection(db, 'healthRequests'), where('village', '==', village));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }, 'Failed to fetch health checkup requests');
  }, []);

  const getActiveTreatments = useCallback(async (healthWorkerId: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(collection(db, 'treatments'), where('healthWorkerId', '==', healthWorkerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }, 'Failed to fetch active treatments');
  }, []);

  const updateTreatment = useCallback(async (treatmentId: string, updateData: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = doc(db, 'treatments', treatmentId);
      await updateDoc(docRef, { ...updateData, updatedAt: serverTimestamp() });
    }, 'Failed to update treatment');
  }, []);

  const select = useCallback(async (cattleId: string, status: boolean) => {
    return executeFirebaseOperation(async () => {
      const q = query(collection(db, 'cattle'), where('selected', '==', true));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        const r = doc(db, 'cattle', document.id);
        await updateDoc(r, {
          selected: false,
        });
      });

      console.log(status);

      if (status == true) {
        const docRef = doc(db, 'cattle', cattleId);
        await updateDoc(docRef, { selected: false, updatedAt: serverTimestamp() });
      }
      if (status == false) {
        const docRef = doc(db, 'cattle', cattleId);
        await updateDoc(docRef, { selected: true, updatedAt: serverTimestamp() });
      }
    }, 'Failed to add select');
  }, []);

  const isSelected = useCallback(async () => {
    return executeFirebaseOperation(async () => {
      const q = query(collection(db, 'cattle'), where('selected', '==', true));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return false;
      } else {
        return true;
      }
    }, 'Failed to show select');
  }, []);

  const createListing = useCallback(async (listingData: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = await addDoc(collection(db, 'listings'), {
        ...listingData,
        createdAt: serverTimestamp(),
      });
      if (listingData.image) {
        const imageRef = ref(storage, `listings/${docRef.id}`);
        await uploadBytes(imageRef, listingData.image);
        const imageUrl = await getDownloadURL(imageRef);
        await updateDoc(docRef, { imageUrl });
      }
      return docRef.id;
    }, 'Failed to create listing');
  }, []);

  const getMarketplaceListings = useCallback(async () => {
    return executeFirebaseOperation(async () => {
      const querySnapshot = await getDocs(collection(db, 'listings'));
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }, 'Failed to fetch marketplace listings');
  }, []);

  const getPendingRegistrations = useCallback(async (village: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'registrations'),
        where('village', '==', village),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }, 'Failed to fetch pending registrations');
  }, []);

  const getRegistrationDetails = useCallback(async (registrationId: string) => {
    return executeFirebaseOperation(async () => {
      const docSnap = await getDoc(doc(db, 'registrations', registrationId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      throw new Error('Registration not found');
    }, 'Failed to fetch registration details');
  }, []);

  const updateRegistrationStatus = useCallback(
    async (registrationId: string, status: 'approved' | 'rejected') => {
      return executeFirebaseOperation(async () => {
        const docRef = doc(db, 'registrations', registrationId);
        await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
      }, `Failed to ${status} registration`);
    },
    []
  );

  const requestHealthCheckup = useCallback(
    async (cattleId: string, farmerAadhaar: string, village: string) => {
      return executeFirebaseOperation(async () => {
        const healthCheckupData = {
          cattleId,
          farmerAadhaar,
          village,
          status: 'pending',
          requestedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'healthRequests'), healthCheckupData);
        return docRef.id;
      }, 'Failed to request health checkup');
    },
    []
  );

  const buyInsurance = useCallback(async (cattleId: string, insuranceData: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = await addDoc(collection(db, 'insurances'), {
        ...insuranceData,
        cattleId,
        status: 'active',
        startDate: serverTimestamp(),
      });
      await updateDoc(doc(db, 'cattle', cattleId), { insuranceId: docRef.id });
      return docRef.id;
    }, 'Failed to buy insurance');
  }, []);

  const claimInsurance = useCallback(async (insuranceId: string, claimData: any) => {
    return executeFirebaseOperation(async () => {
      const insuranceRef = doc(db, 'insurances', insuranceId);
      const insuranceSnap = await getDoc(insuranceRef);

      if (insuranceSnap.exists() && insuranceSnap.data()?.status === 'active') {
        const claimRef = await addDoc(collection(db, 'insuranceClaims'), {
          ...claimData,
          insuranceId,
          status: 'pending',
          claimedAt: serverTimestamp(),
        });
        await updateDoc(insuranceRef, { claimId: claimRef.id });
        return claimRef.id;
      }
      throw new Error('Insurance policy not found or not active');
    }, 'Failed to claim insurance');
  }, []);

  const addFarmer = useCallback(async (farmerData: any, image: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = await addDoc(collection(db, 'farmers'), {
        ...farmerData,
        createdAt: serverTimestamp(),
      });

      if (image) {
        try {
          const photoUrl = await uploadImage(image, `farmers/${docRef.id}/profile`);
          await updateDoc(docRef, { photoUrl });
        } catch (error) {
          console.error('Error uploading farmer image:', error);
        }
      }

      return docRef.id;
    }, 'Failed to add farmer');
  }, []);

  const getFarmersByAgent = useCallback(async (
    agentId: string,
    limitCount: number = 10,
    lastVisible: any = null
  ) => {
    return executeFirebaseOperation(async () => {
      try {
        let q;

        if (!lastVisible) {
          // Initial query without startAfter
          q = query(
            collection(db, 'farmers'),
            where('agentId', '==', agentId),
            orderBy('createdAt', 'desc'),
            firestoreLimit(limitCount)
          );
        } else {
          // Ensure lastVisible is a valid DocumentSnapshot
          if (!lastVisible.exists()) {
            throw new Error('Invalid pagination cursor');
          }
          
          // Query with startAfter
          q = query(
            collection(db, 'farmers'),
            where('agentId', '==', agentId),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            firestoreLimit(limitCount)
          );
        }

        const querySnapshot = await getDocs(q);
        const farmers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

        // Check if there are more farmers only if we have results
        let hasMoreFarmers = false;
        if (lastVisibleDoc) {
          const nextQuery = query(
            collection(db, 'farmers'),
            where('agentId', '==', agentId),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisibleDoc),
            firestoreLimit(1)
          );
          const nextQuerySnapshot = await getDocs(nextQuery);
          hasMoreFarmers = !nextQuerySnapshot.empty;
        }

        return {
          farmers,
          lastVisible: lastVisibleDoc || null,
          hasMoreFarmers
        };
      } catch (error) {
        console.error('Error in getFarmersByAgent:', error);
        throw error;
      }
    }, 'Failed to fetch farmers');
  }, []);

  const getFarmerDetails = useCallback(async (farmerId: string) => {
    return executeFirebaseOperation(async () => {
      const docSnap = await getDoc(doc(db, 'farmers', farmerId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      throw new Error('Farmer not found');
    }, 'Failed to fetch farmer details');
  }, []);

  const deleteCattle = useCallback(async (cattleId: string) => {
    return executeFirebaseOperation(async () => {
      await deleteDoc(doc(db, 'cattle', cattleId));
    }, 'Failed to delete cattle');
  }, []);

  const updateCattle = useCallback(async (cattleId: string, updatedData: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = doc(db, 'cattle', cattleId);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    }, 'Failed to update cattle');
  }, []);

  const deleteFarmer = useCallback(async (farmerId: string) => {
    return executeFirebaseOperation(async () => {
      // First, delete all cattle associated with this farmer
      const cattleQuery = query(collection(db, 'cattle'), where('farmerId', '==', farmerId));
      const cattleSnapshot = await getDocs(cattleQuery);
      const cattleDeletions = cattleSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(cattleDeletions);

      // Then, delete the farmer document
      await deleteDoc(doc(db, 'farmers', farmerId));

      // Finally, delete the farmer's profile picture from storage if it exists
      const imageRef = ref(storage, `farmers/${farmerId}`);
      try {
        await deleteObject(imageRef);
      } catch (error: any) {
        // If the image doesn't exist, just ignore the error
        if (error.code !== 'storage/object-not-found') {
          throw error;
        }
      }
    }, 'Failed to delete farmer');
  }, []);

  const getMedicalHistory = useCallback(async (cattleId: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'medicalRecords'),
        where('cattleId', '==', cattleId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }, 'Failed to fetch medical history');
  }, []);

  const getInsuranceDetails = useCallback(async (cattleId: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'insurances'), 
        where('cattleId', '==', cattleId), 
        firestoreLimit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    }, 'Failed to fetch insurance details');
  }, []);

  const checkFarmerExists = useCallback(async (phoneNumber: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'farmers'),
        where('phoneNumber', '==', phoneNumber),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    }, 'Failed to check farmer existence');
  }, []);

  const checkCattleExists = useCallback(async (tagNo: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'cattle'),
        where('tagNo', '==', tagNo),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    }, 'Failed to check cattle existence');
  }, []);

  const updateFarmer = useCallback(async (farmerId: string, updatedData: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = doc(db, 'farmers', farmerId);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    }, 'Failed to update farmer');
  }, []);

  // Admin-specific functions
  const getAdminAnalytics = async () => {
    return executeFirebaseOperation(async () => {
      const analytics = {
        totalEnterprises: 0,
        totalAgents: 0,
        totalFarmers: 0,
        totalCattle: 0,
        enterpriseBreakdown: [],
        agentPerformance: [],
      };

      // Get enterprises count
      const enterprisesSnapshot = await getDocs(
        query(collection(db, 'farmers'), 
        where('farmerType', '==', 'Enterprise'))
      );
      analytics.totalEnterprises = enterprisesSnapshot.size;

      // Get agents count
      const agentsSnapshot = await getDocs(collection(db, 'agents'));
      analytics.totalAgents = agentsSnapshot.size;

      // Get total farmers
      const farmersSnapshot = await getDocs(collection(db, 'farmers'));
      analytics.totalFarmers = farmersSnapshot.size;

      // Get total cattle
      const cattleSnapshot = await getDocs(collection(db, 'cattle'));
      analytics.totalCattle = cattleSnapshot.size;

      // Get enterprise breakdown
      const enterprises = enterprisesSnapshot.docs;
      for (const enterprise of enterprises) {
        const cattleCount = (await getDocs(
          query(collection(db, 'cattle'), 
          where('farmerId', '==', enterprise.id))
        )).size;

        analytics.enterpriseBreakdown.push({
          id: enterprise.id,
          name: enterprise.data().name,
          cattleCount,
        });
      }

      // Get agent performance
      const agents = agentsSnapshot.docs;
      for (const agent of agents) {
        const cattleRegistered = (await getDocs(
          query(collection(db, 'cattle'), 
          where('registeredBy', '==', agent.id))
        )).size;

        analytics.agentPerformance.push({
          id: agent.id,
          name: agent.data().name,
          cattleRegistered,
        });
      }

      return analytics;
    }, 'Failed to fetch admin analytics');
  };

  const createAssignment = async (assignmentData) => {
    return executeFirebaseOperation(async () => {
      const docRef = await addDoc(collection(db, 'assignments'), {
        ...assignmentData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    }, 'Failed to create assignment');
  };

  const getAssignments = async () => {
    return executeFirebaseOperation(async () => {
      const snapshot = await getDocs(collection(db, 'assignments'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }, 'Failed to fetch assignments');
  };

  const getEnterprises = useCallback(async () => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'farmers'),
        where('farmerType', '==', 'Enterprise'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }, 'Failed to fetch enterprises');
  }, []);

  const addEnterprise = useCallback(async (enterpriseData: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = await addDoc(collection(db, 'farmers'), {
        ...enterpriseData,
        farmerType: 'Enterprise',
        createdAt: serverTimestamp(),
        totalCattle: 0,
        assignedAgents: []
      });
      return docRef.id;
    }, 'Failed to add enterprise');
  }, []);

  const updateEnterprise = useCallback(async (enterpriseId: string, data: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = doc(db, 'farmers', enterpriseId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    }, 'Failed to update enterprise');
  }, []);

  const deleteEnterprise = useCallback(async (enterpriseId: string) => {
    return executeFirebaseOperation(async () => {
      // First, remove all assignments for this enterprise
      const assignmentsSnapshot = await getDocs(
        query(collection(db, 'assignments'), 
        where('enterpriseId', '==', enterpriseId))
      );
      
      const assignmentDeletions = assignmentsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(assignmentDeletions);

      // Then delete the enterprise
      await deleteDoc(doc(db, 'farmers', enterpriseId));
    }, 'Failed to delete enterprise');
  }, []);

  const getAgents = useCallback(async () => {
    return executeFirebaseOperation(async () => {
      const snapshot = await getDocs(
        query(collection(db, 'agents'), 
        orderBy('createdAt', 'desc'))
      );
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }, 'Failed to fetch agents');
  }, []);

  const updateAssignment = useCallback(async (assignmentId: string, data: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = doc(db, 'assignments', assignmentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    }, 'Failed to update assignment');
  }, []);

  const deleteAssignment = useCallback(async (assignmentId: string) => {
    return executeFirebaseOperation(async () => {
      await deleteDoc(doc(db, 'assignments', assignmentId));
    }, 'Failed to delete assignment');
  }, []);

  const addUnassignedCattle = useCallback(async (cattleData: any, images: any) => {
    return executeFirebaseOperation(async () => {
      const docRef = await addDoc(collection(db, 'unassigned_cattle'), {
        ...cattleData,
        createdAt: serverTimestamp(),
      });

      // Upload images if they exist
      if (images) {
        const imageUrls: { [key: string]: string } = {};
        for (const [key, image] of Object.entries(images)) {
          if (image) {
            const imageRef = ref(storage, `unassigned_cattle/${docRef.id}/${key}`);
            await uploadBytes(imageRef, image);
            imageUrls[key] = await getDownloadURL(imageRef);
          }
        }
        
        if (Object.keys(imageUrls).length > 0) {
          await updateDoc(docRef, { imageUrls });
        }
      }

      return docRef.id;
    }, 'Failed to add unassigned cattle');
  }, []);

  const getUnassignedCattle = useCallback(async () => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'unassigned_cattle'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
      }));
    }, 'Failed to fetch unassigned cattle');
  }, []);

  const assignCattleToFarmer = useCallback(async (cattleId: string, farmerId: string) => {
    return executeFirebaseOperation(async () => {
      // Get cattle data
      const cattleDoc = await getDoc(doc(db, 'unassigned_cattle', cattleId));
      if (!cattleDoc.exists()) {
        throw new Error('Cattle not found');
      }

      const cattleData = cattleDoc.data();

      // Add to regular cattle collection
      await addDoc(collection(db, 'cattle'), {
        ...cattleData,
        farmerId,
        assignedAt: serverTimestamp(),
      });

      // Delete from unassigned collection
      await deleteDoc(doc(db, 'unassigned_cattle', cattleId));
    }, 'Failed to assign cattle to farmer');
  }, []);

  const getFarmerByPhone = useCallback(async (phoneNumber: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'farmers'),
        where('phoneNumber', '==', phoneNumber),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    }, 'Failed to fetch farmer by phone');
  }, []);

  const getUnassignedCattleDetails = useCallback(async (cattleId: string) => {
    return executeFirebaseOperation(async () => {
      const docSnap = await getDoc(doc(db, 'unassigned_cattle', cattleId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      throw new Error('Cattle not found');
    }, 'Failed to fetch unassigned cattle details');
  }, []);

  const deleteUnassignedCattle = useCallback(async (cattleId: string) => {
    return executeFirebaseOperation(async () => {
      const docRef = doc(db, 'unassigned_cattle', cattleId);
      
      // Get the cattle data first to delete images
      const cattleDoc = await getDoc(docRef);
      if (cattleDoc.exists()) {
        const cattleData = cattleDoc.data();
        
        // Delete images from storage if they exist
        if (cattleData.imageUrls) {
          for (const [key, url] of Object.entries(cattleData.imageUrls)) {
            const imageRef = ref(storage, `unassigned_cattle/${cattleId}/${key}`);
            try {
              await deleteObject(imageRef);
            } catch (error) {
              console.error(`Error deleting image ${key}:`, error);
            }
          }
        }
      }
      
      // Delete the document
      await deleteDoc(docRef);
    }, 'Failed to delete unassigned cattle');
  }, []);

  const getCattleByAgent = useCallback(async (agentId: string) => {
    return executeFirebaseOperation(async () => {
      const q = query(
        collection(db, 'cattle'),
        where('registeredBy', '==', agentId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }, 'Failed to fetch agent cattle');
  }, []);

  // Add new scan request
  const createScanRequest = useCallback(async (agentId: string, scanImage: string) => {
    return executeFirebaseOperation(async () => {
      const docRef = await addDoc(collection(db, 'scan_requests'), {
        agentId,
        scanImage,
        status: 'pending', // pending, completed, rejected
        createdAt: serverTimestamp(),
        responseData: null
      });
      return docRef.id;
    }, 'Failed to create scan request');
  }, []);

  // Get scan request status
  const getScanRequestStatus = useCallback(async (requestId: string) => {
    return executeFirebaseOperation(async () => {
      const docSnap = await getDoc(doc(db, 'scan_requests', requestId));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      throw new Error('Scan request not found');
    }, 'Failed to get scan request status');
  }, []);

  return {
    loading,
    error,
    select,
    addCattle,
    getCattleByFarmer,
    getCattleDetails,
    addInsurance,
    addHealthRecord,
    getHealthCheckupRequests,
    getActiveTreatments,
    updateTreatment,
    createListing,
    getMarketplaceListings,
    getPendingRegistrations,
    getRegistrationDetails,
    approveRegistration: (id: string) => updateRegistrationStatus(id, 'approved'),
    rejectRegistration: (id: string) => updateRegistrationStatus(id, 'rejected'),
    requestHealthCheckup,
    buyInsurance,
    claimInsurance,
    isSelected,
    addFarmer,
    getFarmersByAgent,
    getFarmerDetails,
    deleteCattle,
    updateCattle,
    deleteFarmer,
    getMedicalHistory,
    getInsuranceDetails,
    checkFarmerExists,
    checkCattleExists,
    updateFarmer,
    getAdminAnalytics,
    createAssignment,
    getAssignments,
    getEnterprises,
    addEnterprise,
    updateEnterprise,
    deleteEnterprise,
    getAgents,
    updateAssignment,
    deleteAssignment,
    addUnassignedCattle,
    getUnassignedCattle,
    assignCattleToFarmer,
    getFarmerByPhone,
    getUnassignedCattleDetails,
    deleteUnassignedCattle,
    getCattleByAgent,
    createScanRequest,
    getScanRequestStatus,
  };
}
