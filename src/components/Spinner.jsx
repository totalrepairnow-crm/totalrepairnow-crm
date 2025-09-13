export default function Spinner({ size = 18 }) {
  return (
    <span
      className="spinner"
      aria-busy="true"
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '2px solid #e2e8f0',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}
