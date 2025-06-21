# PostgreSQL Database Helper Commands
# ----------------------------------

# Change these variables to match your PostgreSQL setup
$PG_BIN = "C:\Program Files\PostgreSQL\17\bin"
$PG_USER = "postgres"
$PG_DB = "wallet"

function Show-Usage {
    Write-Host "PostgreSQL Database Helper Commands" -ForegroundColor Cyan
    Write-Host "------------------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  1: List all tables in the wallet database"
    Write-Host "  2: Show sample data from transactions table"
    Write-Host "  3: Show sample data from reports table"
    Write-Host "  4: Show sample data from dao_proposals table"
    Write-Host "  5: Run custom SQL query"
    Write-Host "  6: Check database connection"
    Write-Host "  7: Exit"
    Write-Host ""
    $choice = Read-Host "Enter your choice (1-7)"
    return $choice
}

function List-Tables {
    Write-Host "Listing all tables in $PG_DB database..." -ForegroundColor Cyan
    & "$PG_BIN\psql.exe" -U $PG_USER -d $PG_DB -c "\dt"
    pause
}

function Show-Transactions {
    Write-Host "Showing sample data from transactions table..." -ForegroundColor Cyan
    & "$PG_BIN\psql.exe" -U $PG_USER -d $PG_DB -c "SELECT id, from_address, to_address, value, currency, tx_hash, risk, status FROM transactions LIMIT 10"
    pause
}

function Show-Reports {
    Write-Host "Showing sample data from reports table..." -ForegroundColor Cyan
    & "$PG_BIN\psql.exe" -U $PG_USER -d $PG_DB -c "SELECT * FROM reports LIMIT 10"
    pause
}

function Show-Proposals {
    Write-Host "Showing sample data from dao_proposals table..." -ForegroundColor Cyan
    & "$PG_BIN\psql.exe" -U $PG_USER -d $PG_DB -c "SELECT * FROM dao_proposals LIMIT 10"
    pause
}

function Run-CustomQuery {
    Write-Host "Enter your SQL query (e.g. SELECT * FROM transactions LIMIT 5):" -ForegroundColor Yellow
    $query = Read-Host
    & "$PG_BIN\psql.exe" -U $PG_USER -d $PG_DB -c "$query"
    pause
}

function Check-Connection {
    Write-Host "Checking database connection..." -ForegroundColor Cyan
    & "$PG_BIN\psql.exe" -U $PG_USER -d $PG_DB -c "SELECT 'Connection successful!' as status"
    pause
}

# Main loop
while ($true) {
    Clear-Host
    $choice = Show-Usage
    
    switch ($choice) {
        1 { List-Tables }
        2 { Show-Transactions }
        3 { Show-Reports }
        4 { Show-Proposals }
        5 { Run-CustomQuery }
        6 { Check-Connection }
        7 { exit }
        default { Write-Host "Invalid choice. Press any key to continue..." -ForegroundColor Red; pause }
    }
}
