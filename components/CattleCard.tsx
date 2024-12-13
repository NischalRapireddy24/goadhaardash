export default function CattleCard({ id, name, goAdhaar, breed, image, onClick }) {
  return (
    <div className="cattle-card" onClick={onClick}>
      <img src={image} alt={name} className="cattle-image" />
      <div className="cattle-details">
        <h3>{name}</h3>
        <p>ID: {goAdhaar}</p>
        <p>Breed: {breed}</p>
      </div>
      <style jsx>{`
        .cattle-card {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: box-shadow 0.2s ease;
        }
        .cattle-card:hover {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
        .cattle-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 50%;
          margin-right: 16px;
        }
        .cattle-details h3 {
          margin: 0;
          font-size: 18px;
        }
        .cattle-details p {
          margin: 4px 0;
          color: #555;
        }
      `}</style>
    </div>
  );
}
