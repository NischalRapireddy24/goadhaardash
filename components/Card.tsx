export default function Card({ title, children }) {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      <div className="card-content">{children}</div>
      <style jsx>{`
        .card {
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h2 {
          margin: 0 0 8px;
          font-size: 20px;
        }
        .card-content {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}
