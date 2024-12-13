export default function Button({ title, onClick, className }) {
  return (
    <button className={`button ${className}`} onClick={onClick}>
      {title}
      <style jsx>{`
        .button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .button:hover {
          opacity: 0.9;
        }
      `}</style>
    </button>
  );
}
