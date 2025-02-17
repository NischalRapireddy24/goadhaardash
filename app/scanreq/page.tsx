'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../utils/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import CattleCard from '../../components/CattleCard';

export default function ScanRequestsPage() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [agentCattle, setAgentCattle] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPendingRequests = () => {
      const q = query(
        collection(db, 'scan_requests'),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingRequests(requests);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchPendingRequests();
    return () => unsubscribe();
  }, []);

  const handleRequestSelect = async (request) => {
    setSelectedRequest(request);
    console.log(request)
  
    try {
      // If phoneNumber exists and is not empty
      if (request.phoneNumber?.trim()) {
        // Check if a farmer exists with this phone number
        const farmerQuery = query(
          collection(db, 'farmers'),
          where('phoneNumber', '==', request.phoneNumber)
        );
        const farmerSnapshot = await getDocs(farmerQuery);
  
        if (!farmerSnapshot.empty) {
          // Fetch farmer's cattle
          const farmer = farmerSnapshot.docs[0];
          const farmerId = farmer.id;
  
          const cattleQuery = query(
            collection(db, 'cattle'),
            where('farmerId', '==', farmerId)
          );
          const cattleSnapshot = await getDocs(cattleQuery);
          const cattle = cattleSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          setAgentCattle(cattle);
          return;
        } else {
          // If farmer does not exist
          await updateDoc(doc(db, 'scan_requests', request.id), {
            status: 'no_number',
            timestamp: serverTimestamp(),
          });
          alert('No farmer found with the provided phone number. Request rejected.');
          setSelectedRequest(null);
          return;
        }
      }
  
      // If phoneNumber is missing or empty, fetch cattle under the agent
      if (request.phoneNumber == ""){

        const farmersQuery = query(
          collection(db, 'farmers'),
          where('agentId', '==', request.agentId)
        );
        const farmersSnapshot = await getDocs(farmersQuery);
        const farmerIds = farmersSnapshot.docs.map((doc) => doc.id);

        // Fetch all cattle linked to those farmers
        const cattleQuery = query(
          collection(db, 'cattle'),
          where('farmerId', 'in', farmerIds)
        );
        const cattleSnapshot = await getDocs(cattleQuery);
        const cattle = cattleSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
    
        setAgentCattle(cattle);
        console.log(cattle)
      }

    } catch (error) {
      console.error('Error fetching cattle data:', error);
      alert('Failed to fetch cattle data.');
      setAgentCattle([]);
    }
  };
  

  const handleCattleSelect = async (cattle) => {
    if (!selectedRequest) return;

    try {
      await updateDoc(doc(db, 'scan_requests', selectedRequest.id), {
        status: 'completed',
        responseData: {
          cattleId: cattle.id,
          timestamp: serverTimestamp(),
        },
      });

      setSelectedRequest(null);
      setAgentCattle([]);
      setSearchQuery('');
      setSearchResult(null);
    } catch (error) {
      console.error('Error updating scan request:', error);
      alert('Failed to process the selected cattle.');
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      await updateDoc(doc(db, 'scan_requests', selectedRequest.id), {
        status: 'rejected',
        timestamp: serverTimestamp(),
      });

      setSelectedRequest(null);
      setAgentCattle([]);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject the request.');
    }
  };

  const handleNoCattleFound = async () => {
    if (!selectedRequest) return;

    try {
      await updateDoc(doc(db, 'scan_requests', selectedRequest.id), {
        status: 'not_found',
        timestamp: serverTimestamp(),
      });

      setSelectedRequest(null);
      setAgentCattle([]);
    } catch (error) {
      console.error('Error marking no cattle found:', error);
      alert('Failed to process the request.');
    }
  };

  const handleSearchCattle = async () => {
    if (!searchQuery) return;

    try {
      const searchQueryRef = query(
        collection(db, 'cattle'),
        where('goAdhaar', '==', searchQuery)
      );
      const searchSnapshot = await getDocs(searchQueryRef);

      if (!searchSnapshot.empty) {
        const result = searchSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))[0];
        setSearchResult(result);
      } else {
        setSearchResult(null);
        alert('No cattle found with the provided goAdhaar.');
      }
    } catch (error) {
      console.error('Error searching for cattle:', error);
      alert('Failed to search for cattle.');
    }
  };

  return (
    <div className="container">
      <Header title="Scan Requests" showBackButton onBack={() => router.back()} />

      <div className="content">
        {selectedRequest ? (
          <>
            <Card title="Scanned Image">
              <img
                src={selectedRequest.scanImage || '/fallback-image.png'}
                alt="Scanned"
                className="selected-scan-image"
                onError={(e) => { e.target.src = '/fallback-image.png'; }}
              />
              <div className="button-container">
                <Button
                  title="No Cattle Found"
                  onClick={handleNoCattleFound}
                  className="not-found-button"
                />
                <Button
                  title="Reject Request"
                  onClick={handleRejectRequest}
                  className="reject-button"
                />
              </div>
            </Card>

            <h3>Farmer Number: {selectedRequest.phoneNumber || 'N/A'}</h3>

            <h2>Select Matching Cattle:</h2>
                      {agentCattle.length > 0 ? (
            agentCattle.map((cattle) => (
              <CattleCard
                key={cattle.id}
                {...cattle}
                onClick={() => handleCattleSelect(cattle)}
              />
            ))
          ) : (
            <p>No cattle found for this farmer or agent.</p>
          )}

          </>
        ) : (
          <div>
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <Card key={request.id}>
                  <div onClick={() => handleRequestSelect(request)}>
                    <img
                      src={request.scanImage || '/fallback-image.png'}
                      alt="Scan Request"
                      className="scan-image"
                      onError={(e) => { e.target.src = '/fallback-image.png'; }}
                    />
                    <p>{request.createdAt?.toDate().toLocaleString() || 'Unknown date'}</p>
                  </div>
                </Card>
              ))
            ) : (
              <p>No pending scan requests.</p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          padding: 16px;
          background-color: #f4f4f9;
          color: #333;
        }
        .content {
          margin-top: 16px;
        }
        .scan-image {
          width: 300px;
          height: auto;
          border-radius: 8px;
          border: 2px solid #ddd;
        }

        .selected-scan-image {
          width: 300px;
          max-height: 300px;
          margin-bottom: 16px;
          border-radius: 8px;
          border: 3px solid #4caf50;
        }
        .button-container {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
        }
        .not-found-button,
        .reject-button {
          flex: 1;
          margin: 0 8px;
        }
          
      `}</style>
    </div>
  );
}
