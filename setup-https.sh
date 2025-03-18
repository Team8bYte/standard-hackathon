#!/bin/bash

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Setting up HTTPS for local development =====${NC}\n"

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo -e "${YELLOW}mkcert is not installed. Please install it first.${NC}"
    
    # Check OS and provide instructions
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "On macOS, you can install it using Homebrew:"
        echo -e "${GREEN}brew install mkcert${NC}"
        echo -e "${GREEN}brew install nss # for Firefox${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "On Linux, you can install it using your package manager:"
        echo -e "${GREEN}sudo apt install mkcert${NC}"
        echo -e "Or download from: https://github.com/FiloSottile/mkcert/releases"
    elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
        echo -e "On Windows, you can install it using Chocolatey:"
        echo -e "${GREEN}choco install mkcert${NC}"
        echo -e "Or download from: https://github.com/FiloSottile/mkcert/releases"
    fi
    
    exit 1
fi

echo -e "${GREEN}✓ mkcert is installed${NC}"

# Check if certificates directory exists
if [ ! -d "./certificates" ]; then
    echo -e "Creating certificates directory..."
    mkdir -p ./certificates
fi

# Install local CA
echo -e "\n${BLUE}Installing local Certificate Authority...${NC}"
mkcert -install

# Generate certificates for localhost
echo -e "\n${BLUE}Generating certificates for localhost...${NC}"
mkcert -key-file ./certificates/key.pem -cert-file ./certificates/cert.pem localhost 127.0.0.1 ::1

echo -e "\n${GREEN}✓ Certificates generated successfully!${NC}"
echo -e "  - Certificate: ./certificates/cert.pem"
echo -e "  - Key: ./certificates/key.pem"

# Create a next.config.js entry for HTTPS
echo -e "\n${BLUE}Next.js HTTPS setup is complete.${NC}"
echo -e "You can now run your development server with HTTPS using:"
echo -e "${GREEN}npm run dev:https${NC}"

echo -e "\n${YELLOW}Note: For full facial verification functionality, always use HTTPS.${NC}"
echo -e "Modern browsers require secure contexts (HTTPS) for accessing the camera API reliably."

exit 0 