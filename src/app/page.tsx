'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Card, CardBody, CardHeader, Spinner, Pagination } from "@nextui-org/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { Selection } from "@nextui-org/react";
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { WalletListResponse } from "./api/wallets/route";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WALLETS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const SUPPORTED_NETWORKS = ['base-sepolia', 'base-mainnet'];

export default function Home() {
  const [wallets, setWallets] = useState<WalletListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<Selection>(new Set([]));
  const [walletsPerPage, setWalletsPerPage] = useState(WALLETS_PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchWallets();
  }, []);

  async function fetchWallets() {
    try {
      const response = await fetch('/api/wallets');
      if (!response.ok) throw new Error('Failed to fetch wallets');
      const data = await response.json();
      setWallets(data);
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError('Failed to load wallets. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const networkId = Array.from(selectedNetwork)[0] as string;
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkId }),
      });

      if (!response.ok) throw new Error('Failed to create wallet');

      const data = await response.json();
      router.push(`/wallets/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { name: "WALLET ID", uid: "id" },
    { name: "NETWORK", uid: "network" },
  ];

  const renderCell = (wallet, columnKey) => {
    const cellValue = wallet[columnKey];
    switch (columnKey) {
      case "id":
        return (
          <span className="text-blue-600 cursor-pointer" onClick={() => router.push(`/wallets/${wallet.id}`)}>
            {cellValue}
          </span>
        );
      default:
        return cellValue;
    }
  };

  const paginatedWallets = wallets.slice(
    (currentPage - 1) * walletsPerPage,
    currentPage * walletsPerPage
  );

  const totalPages = Math.ceil(wallets.length / walletsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-600">CDP Wallet Manager</h1>
      
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Wallets</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Wallets per page:</span>
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  variant="bordered" 
                  className="text-sm min-w-[70px]"
                  endContent={<ChevronDownIcon className="h-4 w-4" />}
                >
                  {walletsPerPage}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Wallets per page"
                onAction={(key) => setWalletsPerPage(Number(key))}
              >
                {WALLETS_PER_PAGE_OPTIONS.map((option) => (
                  <DropdownItem key={option}>{option}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardHeader>
        <CardBody>
          <Table aria-label="Wallets table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.uid}>{column.name}</TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {paginatedWallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  {columns.map((column) => (
                    <TableCell key={`${wallet.id}-${column.uid}`}>
                      {renderCell(wallet, column.uid)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-between items-center mt-6">
            <div className="flex justify-center items-center gap-2">
              <Button
                isIconOnly
                aria-label="Previous page"
                variant="light"
                isDisabled={currentPage === 1}
                onPress={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                isDisabled={currentPage === totalPages}
                onPress={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="bordered" 
                    className="text-sm"
                    endContent={<ChevronDownIcon className="h-4 w-4" />}
                  >
                    {selectedNetwork.size > 0 ? Array.from(selectedNetwork)[0] as string : "Select Network"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Select Network"
                  disallowEmptySelection
                  selectionMode="single"
                  selectedKeys={selectedNetwork}
                  onSelectionChange={setSelectedNetwork}
                  className="bg-white dark:bg-gray-800"
                >
                  {SUPPORTED_NETWORKS.map((network) => (
                    <DropdownItem key={network} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      {network}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
              <Button
                color="primary"
                className="text-sm text-white bg-blue-600 hover:bg-blue-700"
                disabled={loading || selectedNetwork.size === 0}
                onClick={handleCreateWallet}
              >
                {loading ? <Spinner size="sm" /> : 'Create Wallet'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
    </div>
  );
}