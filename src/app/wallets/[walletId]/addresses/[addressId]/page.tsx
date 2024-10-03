'use client'

import { useEffect, useState } from 'react';
import Link from "next/link";
import { ArrowLeft, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { AddressResponse } from '@/app/api/wallets/[walletId]/addresses/[addressId]/route';
import CustomInput from '@/app/components/CustomInput';

const BALANCES_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function AddressPage({ params }: { params: { walletId: string, addressId: string } }) {
  const [address, setAddress] = useState<AddressResponse | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faucetError, setFaucetError] = useState<string | null>(null);
  const [faucetSuccess, setFaucetSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [balancesPerPage, setBalancesPerPage] = useState(BALANCES_PER_PAGE_OPTIONS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchAddress = async () => {
    try {
      setAddressLoading(true);
      const response = await fetch(`/api/wallets/${params.walletId}/addresses/${params.addressId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch address data');
      }
      const data: AddressResponse = await response.json();
      setAddress(data);
    } catch (err) {
      setError('Error fetching address data');
      console.error(err);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, [params.walletId, params.addressId]);

  const handleFaucetRequest = async () => {
    setFaucetLoading(true);
    setFaucetError(null);
    setFaucetSuccess('');

    try {
      const response = await fetch(`/api/wallets/${params.walletId}/addresses/${params.addressId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request faucet');
      }

      setFaucetSuccess('Faucet request successful!');
      
      // Fetch updated address data after successful faucet request
      await fetchAddress();
    } catch (err) {
      setFaucetError('Failed to request faucet funds');
      console.error(err);
    } finally {
      setFaucetLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess('');

    try {
      const response = await fetch(`/api/wallets/${params.walletId}/addresses/${params.addressId}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination_address: destinationAddress,
          amount,
          asset: asset,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transfer');
      }

      const data = await response.json();
      setTransferSuccess(data.transactionLink);

      setDestinationAddress('');
      setAmount('');
      setAsset('');
    } catch (err) {
      console.error('Error creating transfer:', err);
      if (err instanceof Error) {
        setTransferError(err.message);
      } else {
        setTransferError('An unknown error occurred');
      }
    } finally {
      setTransferLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleBalancesPerPageChange = (key: string) => {
    setBalancesPerPage(Number(key));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (addressLoading) {
    return (
      <div className="fixed inset-0 bg-background/50 backdrop-blur-md flex justify-center items-center z-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !address) {
    return <div className="text-danger">{error || 'Address not found'}</div>;
  }

  const totalBalancePages = Math.ceil(Object.keys(address.balances).length / balancesPerPage);
  const startIndex = (currentPage - 1) * balancesPerPage;
  const endIndex = startIndex + balancesPerPage;
  const currentBalances = Object.entries(address.balances).slice(startIndex, endIndex);

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <Link href={`/wallets/${address.walletId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
        <ArrowLeft className="mr-2" size={20} />
        <span>Back to Wallet</span>
      </Link>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex justify-between items-center px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <CreditCard size={24} className="text-blue-600" />
            <div>
              <h1 className="text-lg text-gray-800 dark:text-gray-200 font-semibold">Address Details</h1>
              <p className="text-sm text-gray-500">ID: {address.id}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Network</p>
              <p className="text-base">{address.network}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Wallet ID</p>
              <p className="text-base">{address.walletId}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex justify-between items-center px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold">Balances</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <Dropdown onOpenChange={setIsDropdownOpen}>
              <DropdownTrigger>
                <Button 
                  variant="light" 
                  className={`min-w-[70px] border transition-colors ${
                    isDropdownOpen
                      ? 'bg-blue-100 border-blue-600 text-blue-600'
                      : 'bg-transparent border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {balancesPerPage}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Balances per page"
                onAction={(key) => handleBalancesPerPageChange(key.toString())}
              >
                {BALANCES_PER_PAGE_OPTIONS.map((option) => (
                  <DropdownItem key={option}>{option}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <Table aria-label="Balances table" className="min-w-full">
            <TableHeader>
              <TableColumn className="text-left">CURRENCY</TableColumn>
              <TableColumn className="text-right">AMOUNT</TableColumn>
            </TableHeader>
            <TableBody>
              {currentBalances.map(([currency, amount]) => (
                <TableRow key={currency}>
                  <TableCell className="text-left text-base">{currency}</TableCell>
                  <TableCell className="text-right text-base">{amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-center items-center mt-4 gap-2">
            <Button
              isIconOnly
              aria-label="Previous page"
              variant="light"
              isDisabled={currentPage === 1}
              onPress={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalBalancePages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                size="sm"
                variant={currentPage === page ? "solid" : "light"}
                onPress={() => handlePageChange(page)}
                className={`w-8 h-8 text-sm ${
                  currentPage === page ? "bg-blue-600 text-white" : "text-gray-700"
                }`}
              >
                {page}
              </Button>
            ))}
            <Button
              isIconOnly
              aria-label="Next page"
              variant="light"
              isDisabled={currentPage === totalBalancePages}
              onPress={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="px-6 py-4 bg-gray-50">
            <h2 className="text-lg font-semibold">Request Faucet Funds</h2>
          </CardHeader>
          <CardBody className="px-6 py-4">
            <Button
              color="primary"
              variant="solid"
              onClick={handleFaucetRequest}
              isLoading={faucetLoading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {faucetLoading ? 'Requesting...' : 'Request Faucet'}
            </Button>
            {faucetError && <p className="text-danger mt-2">{faucetError}</p>}
            {faucetSuccess && <p className="text-success mt-2">{faucetSuccess}</p>}
          </CardBody>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="px-6 py-4 bg-gray-50">
            <h2 className="text-lg font-semibold">Create Transfer</h2>
          </CardHeader>
          <CardBody className="px-6 py-4">
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <CustomInput
                label="Destination Address"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                required
                placeholder="0x..."
              />
              <CustomInput
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                required
                min="0"
                step="any"
                placeholder="0.00"
              />
              <CustomInput
                label="Asset"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                required
                placeholder="eth, usdc, etc."
              />
              <Button
                color="primary"
                type="submit"
                isLoading={transferLoading}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {transferLoading ? 'Creating Transfer...' : 'Create Transfer'}
              </Button>
            </form>
            {transferError && <p className="text-danger mt-2">{transferError}</p>}
            {transferSuccess && (
            <div>
              <strong>Transaction Link:</strong>{' '}
              <Link 
                href={transferSuccess} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Transaction
              </Link>
            </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}