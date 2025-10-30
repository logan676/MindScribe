import { useState } from 'react';
import { CreditCard, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoice_url: string;
  description: string;
}

const mockBillingHistory: BillingHistory[] = [
  {
    id: 'INV-2024-10',
    date: '2024-10-01',
    amount: 99.00,
    status: 'paid',
    invoice_url: '/invoices/2024-10.pdf',
    description: 'Pro Plan - October 2024'
  },
  {
    id: 'INV-2024-09',
    date: '2024-09-01',
    amount: 99.00,
    status: 'paid',
    invoice_url: '/invoices/2024-09.pdf',
    description: 'Pro Plan - September 2024'
  },
  {
    id: 'INV-2024-08',
    date: '2024-08-01',
    amount: 99.00,
    status: 'paid',
    invoice_url: '/invoices/2024-08.pdf',
    description: 'Pro Plan - August 2024'
  },
  {
    id: 'INV-2024-07',
    date: '2024-07-01',
    amount: 99.00,
    status: 'paid',
    invoice_url: '/invoices/2024-07.pdf',
    description: 'Pro Plan - July 2024'
  },
];

export function Billing() {
  const [showUpdatePayment, setShowUpdatePayment] = useState(false);

  // Mock subscription data
  const subscription = {
    plan: 'Pro Plan',
    status: 'active',
    price: 99.00,
    billingCycle: 'monthly',
    nextBillingDate: 'November 1, 2024',
    cancelAt: null,
  };

  const paymentMethod = {
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: '12',
    expiryYear: '2025',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const handleUpdatePaymentMethod = () => {
    // TODO: Implement payment method update
    console.log('Update payment method');
    setShowUpdatePayment(false);
  };

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.')) {
      // TODO: Implement subscription cancellation
      console.log('Cancel subscription');
    }
  };

  const handleDownloadInvoice = (invoiceUrl: string) => {
    // TODO: Implement invoice download
    console.log('Download invoice:', invoiceUrl);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Billing & Subscription
            </h1>
            <p className="text-gray-600">
              Manage your subscription, payment methods, and billing history.
            </p>
          </div>
          <Link
            to="/settings"
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Settings
          </Link>
        </div>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Current Subscription
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Details */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {subscription.plan}
                </h3>
                <p className="text-sm text-gray-600">
                  ${subscription.price.toFixed(2)}/{subscription.billingCycle}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {subscription.status}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Next billing date:</span>
                <span className="font-medium text-gray-900">{subscription.nextBillingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing cycle:</span>
                <span className="font-medium text-gray-900 capitalize">{subscription.billingCycle}</span>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Plan Includes:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Unlimited session recordings</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>AI-powered transcription</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Automated clinical note generation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>HIPAA-compliant storage</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upgrade Plan
          </button>
          <button
            onClick={handleCancelSubscription}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Payment Method
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {paymentMethod.brand} ending in {paymentMethod.last4}
              </p>
              <p className="text-sm text-gray-600">
                Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpdatePayment(true)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Update Payment Method
          </button>
        </div>

        {/* Update Payment Method Modal */}
        {showUpdatePayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Payment Method
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdatePaymentMethod}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowUpdatePayment(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Billing History
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockBillingHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(item.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDownloadInvoice(item.invoice_url)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mockBillingHistory.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No billing history available</p>
          </div>
        )}
      </div>
    </div>
  );
}
