#!/bin/sh

set -eu

REMOTE_HOST="${REMOTE_HOST:-cioos-co-dev-1}"
REMOTE_PATH="${REMOTE_PATH:-/srv/files/translation-review}"

found_results=false
for path in results*; do
	if [ -e "$path" ]; then
		found_results=true
		break
	fi
done

if [ "$found_results" = false ]; then
	echo "No results directories matched 'results*' in $(pwd)" >&2
	exit 1
fi

ssh "$REMOTE_HOST" "sudo mkdir -p '$REMOTE_PATH'"
rsync -avm \
	--rsync-path="sudo rsync" \
	--include='*/' \
	--include='data.json' \
	--include='comparison-*.html' \
	--include='index.html' \
	--exclude='*' \
	results* "$REMOTE_HOST:$REMOTE_PATH/"
ssh "$REMOTE_HOST" "sudo find '$REMOTE_PATH' -type d -exec chmod 755 {} + && sudo find '$REMOTE_PATH' -type f -exec chmod 644 {} +"
