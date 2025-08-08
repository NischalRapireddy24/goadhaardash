'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../utils/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function ScanRequestsPage() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [allCattle, setAllCattle] = useState([]);
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
    console.log(request);

    try {
      // Fetch ALL cattle from database
      const cattleQuery = query(collection(db, 'cattle'));
      const cattleSnapshot = await getDocs(cattleQuery);
      const cattle = cattleSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllCattle(cattle);
    } catch (error) {
      console.error('Error fetching all cattle:', error);
      alert('Failed to fetch cattle data.');
      setAllCattle([]);
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
      setAllCattle([]);
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
      setAllCattle([]);
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
      setAllCattle([]);
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
        where('godhaar', '==', searchQuery)
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
        alert('No cattle found with the provided GoDhaar.');
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
            {allCattle.length > 0 ? (
              allCattle.map((cattle) => (
                <Card key={cattle.id}>
                  <div onClick={() => handleCattleSelect(cattle)}>
                    <img
                      src={
                        cattle.imageUrls?.leftPic ||
                        cattle.imageUrls?.rightPic ||
                        '/fallback-image.png'
                      }
                      alt="Cattle Side View"
                      className="scan-image"
                      onError={(e) => { e.target.src = '/fallback-image.png'; }}
                    />
                    <p>GoDhaar: {cattle.godhaar || 'N/A'}</p>
                  </div>
                </Card>
              ))
            ) : (
              <p>No cattle found in the database.</p>
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
