export default function Header({ title, showBackButton, onBack }) {
  return (
    <header className="header">
      {showBackButton && (
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
      )}
      <h1>{title}</h1>
      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #ccc;
        }
        .back-button {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #0070f3;
        }
        h1 {
          margin: 0;
          font-size: 24px;
        }
      `}</style>
    </header>
  );
}
