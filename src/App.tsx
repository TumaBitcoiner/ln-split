import { useState } from 'react';
import { Zap, Users, Wallet } from 'lucide-react';
import { InvoiceQRCode } from './components/InvoiceQRCode';
import { DonationBox } from './components/DonationBox';
import { splitBill } from './utils/splitBill';

function App() {
  const [lnaddress, setLnaddress] = useState('');
  const [amount, setAmount] = useState('');
  const [numPeople, setNumPeople] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{ success: boolean; message: string } | null>(null);
  const [invoices, setInvoices] = useState<string[]>([]);

  // Set your donation Lightning address here
  const DONATION_ADDRESS = 'tuma@walletofsatoshi.com'; // CHANGE THIS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);
    setInvoices([]); // Clear previous invoices

    try {
      // Call the client-side splitBill function
      const result = await splitBill({
        lnAddress: lnaddress,
        amount: parseInt(amount),
        numPeople: parseInt(numPeople)
      });

      if (result.error) {
        setResponse({ 
          success: false, 
          message: result.error 
        });
      } else {
        setInvoices(result.invoices);
        setResponse({ 
          success: true, 
          message: `Successfully generated ${result.invoices.length} invoices! (${result.shareSats} sats each)` 
        });
        
        // Clear form on success
        setLnaddress('');
        setAmount('');
        setNumPeople('');
      }
    } catch (error: any) {
      setResponse({ 
        success: false, 
        message: `Unexpected error: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const amountPerPerson = amount && numPeople ? Math.ceil(parseInt(amount) / parseInt(numPeople)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-3 rounded-xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            LN Split
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Split Lightning Network payments with ease
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="lnaddress" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-orange-500" />
                  Lightning Address
                </div>
              </label>
              <input
                type="text"
                id="lnaddress"
                value={lnaddress}
                onChange={(e) => setLnaddress(e.target.value)}
                placeholder="claude@walletofsatoshi.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount (sats)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                min="1"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="numPeople" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  Number of People
                </div>
              </label>
              <input
                type="number"
                id="numPeople"
                value={numPeople}
                onChange={(e) => setNumPeople(e.target.value)}
                placeholder="5"
                min="2"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
              />
            </div>

            {amountPerPerson > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600 mb-1">Amount per person:</p>
                <p className="text-2xl font-bold text-orange-600">
                  {amountPerPerson.toLocaleString()} sats
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating Invoices...' : 'Split Payment'}
            </button>
          </form>

          {response && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                response.success
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{response.message}</p>
            </div>
          )}
        </div>

        {/* Donation Box - Shows when invoices are generated */}
        {invoices.length > 0 && (
          <DonationBox donationAddress={DONATION_ADDRESS} />
        )}

        {/* Payment Invoices Section */}
        {invoices.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Payment Invoices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {invoices.map((invoice, index) => (
                <InvoiceQRCode key={index} invoice={invoice} index={index} />
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Powered by Lightning Network
        </p>
      </div>
    </div>
  );
}

export default App;