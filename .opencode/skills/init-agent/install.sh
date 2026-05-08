#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[info]${NC} $1"; }
log_success() { echo -e "${GREEN}[success]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
log_error() { echo -e "${RED}[error]${NC} $1"; }

# Default target directory
TARGET_DIR="${1:-.}"

# Validate target directory
if [ ! -d "$TARGET_DIR" ]; then
    log_error "Target directory does not exist: $TARGET_DIR"
    exit 1
fi

# Create .opencode structure
SKILL_DIR="$TARGET_DIR/.opencode/skills/init-agent"
ROLES_DIR="$SKILL_DIR/roles"

log_info "Installing init-agent skill to $TARGET_DIR..."

# Create directories
mkdir -p "$ROLES_DIR"
mkdir -p "$SKILL_DIR/bin"
mkdir -p "$ROLES_DIR/_templates"

log_success "Created directory structure"

# Download from GitHub
TEMP_DIR=$(mktemp -d)
REPO="https://github.com/fifaliao/smartAgent"
BRANCH="main"

log_info "Downloading from $REPO..."

# Download files using curl or wget
if command -v curl &> /dev/null; then
    DOWNLOADER="curl -fsSL"
elif command -v wget &> /dev/null; then
    DOWNLOADER="wget -qO-"
else
    log_error "Neither curl nor wget found. Please install one of them."
    exit 1
fi

# Download SKILL.md
log_info "Downloading SKILL.md..."
$DOWNLOADER "$REPO/raw/$BRANCH/.opencode/skills/init-agent/SKILL.md" > "$SKILL_DIR/SKILL.md"

# Download agent.js
log_info "Downloading agent.js..."
$DOWNLOADER "$REPO/raw/$BRANCH/.opencode/skills/init-agent/agent.js" > "$SKILL_DIR/agent.js"
chmod +x "$SKILL_DIR/agent.js"

# Download package.json
log_info "Downloading package.json..."
$DOWNLOADER "$REPO/raw/$BRANCH/.opencode/skills/init-agent/package.json" > "$SKILL_DIR/package.json"

# Download roles
log_info "Downloading roles..."
for role in sisyphus; do
    $DOWNLOADER "$REPO/raw/$BRANCH/.opencode/skills/init-agent/roles/$role.yaml" > "$ROLES_DIR/$role.yaml"
    log_success "  - $role"
done

# Download templates
log_info "Downloading templates..."
for template in developer reviewer collaborator; do
    $DOWNLOADER "$REPO/raw/$BRANCH/.opencode/skills/init-agent/roles/_templates/$template.yaml" > "$ROLES_DIR/_templates/$template.yaml"
    log_success "  - $template"
done

# Create bin wrapper
log_info "Creating bin wrapper..."
cat > "$SKILL_DIR/bin/init-agent" << 'BINEOF'
#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$DIR/../agent.js"
if command -v node &> /dev/null; then
    node "$SCRIPT" "$@"
else
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi
BINEOF
chmod +x "$SKILL_DIR/bin/init-agent"

# Cleanup
rm -rf "$TEMP_DIR"

log_success ""
log_success "Installation complete!"
log_info ""
log_info "Available roles:"
echo "  - sisyphus: Master orchestrator for AI agents"
echo "  - developer: Software developer role"
echo "  - reviewer: Code reviewer role"
echo "  - collaborator: Pair programming partner"
echo ""
log_info "Usage:"
echo "  node $SKILL_DIR/agent.js --list"
echo "  node $SKILL_DIR/agent.js --role sisyphus"
echo "  node $SKILL_DIR/agent.js --show sisyphus"
echo ""
log_info "Or with npx:"
echo "  npx $SKILL_DIR/bin/init-agent --role sisyphus"
