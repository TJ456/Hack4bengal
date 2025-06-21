#!/usr/bin/env python3
"""
ML Data Collector for Wallet Analytics

This script helps ML teams collect wallet analytics data from the API
for training and prediction purposes.

Usage:
    python ml_data_collector.py --addresses addresses.txt --output dataset.csv
    python ml_data_collector.py --single 0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b
"""

import requests
import pandas as pd
import argparse
import json
import time
from typing import List, Dict, Optional
from io import StringIO
import sys

class WalletAnalyticsCollector:
    def __init__(self, api_base: str = "http://localhost:8080/api"):
        self.api_base = api_base
        self.session = requests.Session()
        
    def get_single_wallet(self, address: str) -> Optional[Dict]:
        """Get analytics for a single wallet address"""
        try:
            response = self.session.get(f"{self.api_base}/analytics/wallet/{address}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for {address}: {e}")
            return None
    
    def get_bulk_wallets(self, addresses: List[str], format: str = "json") -> Optional[Dict]:
        """Get analytics for multiple wallet addresses"""
        try:
            payload = {
                "addresses": addresses,
                "format": format
            }
            response = self.session.post(f"{self.api_base}/analytics/bulk", json=payload)
            response.raise_for_status()
            
            if format == "csv":
                return {"csv_data": response.text}
            else:
                return response.json()
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching bulk data: {e}")
            return None
    
    def export_dataset(self, addresses: List[str], filename: str = "dataset.csv") -> bool:
        """Export analytics as CSV file"""
        try:
            payload = {
                "addresses": addresses,
                "filename": filename
            }
            response = self.session.post(f"{self.api_base}/analytics/export", json=payload)
            response.raise_for_status()
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            print(f"Dataset exported to {filename}")
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"Error exporting dataset: {e}")
            return False
    
    def collect_data_in_batches(self, addresses: List[str], batch_size: int = 100) -> pd.DataFrame:
        """Collect data in batches to handle large address lists"""
        all_data = []
        total_batches = (len(addresses) + batch_size - 1) // batch_size
        
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            
            print(f"Processing batch {batch_num}/{total_batches} ({len(batch)} addresses)...")
            
            result = self.get_bulk_wallets(batch, format="json")
            if result and result.get('data'):
                all_data.extend(result['data'])
                if result.get('errors'):
                    print(f"Batch {batch_num} had {len(result['errors'])} errors")
            
            # Rate limiting - wait between batches
            if i + batch_size < len(addresses):
                time.sleep(1)
        
        return pd.DataFrame(all_data)

def load_addresses_from_file(filename: str) -> List[str]:
    """Load wallet addresses from a text file (one per line)"""
    try:
        with open(filename, 'r') as f:
            addresses = [line.strip() for line in f if line.strip()]
        return addresses
    except FileNotFoundError:
        print(f"Error: File {filename} not found")
        return []

def validate_address(address: str) -> bool:
    """Basic validation for Ethereum addresses"""
    return address.startswith('0x') and len(address) == 42

def main():
    parser = argparse.ArgumentParser(description='Collect wallet analytics data for ML')
    parser.add_argument('--api-url', default='http://localhost:8080/api', 
                       help='API base URL')
    parser.add_argument('--single', help='Single wallet address to analyze')
    parser.add_argument('--addresses', help='File containing wallet addresses (one per line)')
    parser.add_argument('--output', default='wallet_analytics.csv', 
                       help='Output CSV filename')
    parser.add_argument('--batch-size', type=int, default=100,
                       help='Batch size for bulk requests')
    parser.add_argument('--format', choices=['csv', 'json'], default='csv',
                       help='Output format')
    
    args = parser.parse_args()
    
    collector = WalletAnalyticsCollector(args.api_url)
    
    if args.single:
        # Single wallet analysis
        if not validate_address(args.single):
            print(f"Error: Invalid address format: {args.single}")
            return
        
        print(f"Fetching analytics for {args.single}...")
        data = collector.get_single_wallet(args.single)
        
        if data:
            if args.format == 'json':
                print(json.dumps(data, indent=2))
            else:
                df = pd.DataFrame([data])
                df.to_csv(args.output, index=False)
                print(f"Data saved to {args.output}")
        else:
            print("Failed to fetch data")
    
    elif args.addresses:
        # Bulk wallet analysis
        addresses = load_addresses_from_file(args.addresses)
        if not addresses:
            return
        
        # Validate addresses
        valid_addresses = [addr for addr in addresses if validate_address(addr)]
        invalid_count = len(addresses) - len(valid_addresses)
        
        if invalid_count > 0:
            print(f"Warning: {invalid_count} invalid addresses skipped")
        
        if not valid_addresses:
            print("Error: No valid addresses found")
            return
        
        print(f"Collecting data for {len(valid_addresses)} addresses...")
        
        if len(valid_addresses) <= 1000:
            # Use export endpoint for direct CSV download
            if collector.export_dataset(valid_addresses, args.output):
                print(f"Dataset exported to {args.output}")
        else:
            # Use batch processing for large datasets
            df = collector.collect_data_in_batches(valid_addresses, args.batch_size)
            if not df.empty:
                df.to_csv(args.output, index=False)
                print(f"Collected data for {len(df)} wallets, saved to {args.output}")
            else:
                print("No data collected")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
