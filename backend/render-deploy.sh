# Render deployment script
# This script can be used to manually build and deploy to Render

# Get the current directory
CURRENT_DIR=$(pwd)

# Build the Go application
echo "Building Go application..."
CGO_ENABLED=0 go build -o app .

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build successful! Application binary created."
echo ""
echo "To deploy to Render:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Render"
echo "3. Create a new Web Service using the Dockerfile"
echo ""
echo "For local testing you can run:"
echo "./app"
