
const PaymentBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-black">
      {/* Animated background elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-600/10 rounded-full blur-3xl animate-pulse"></div>
      
      {/* Additional decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-teal-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
    </div>
  );
};

export default PaymentBackground;
