
const PaymentBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-5 right-5 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-5 left-5 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
    </div>
  );
};

export default PaymentBackground;
