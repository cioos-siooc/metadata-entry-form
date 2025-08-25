run-dev:
	cd firebase-functions/functions && \
	nohup firebase emulators:start --import=./emulator-data --export-on-exit > emulator.log 2>&1 & echo $$! > emulator.pid
	@echo "Open the Firebase Emulator UI: http://localhost:4000"

stop-dev:
	kill $$(cat emulator.pid) && rm emulator.pid

sync-dev-locally:
	@echo "Load development database locally"
	firebase database:get / --project cioos-metadata-form-dev-258dc > firebase-functions/functions/emulator-data/database_export/cioos-metadata-form.json

sync-prod-locally:
	@echo "Load production database locally"
	firebase database:get / --project cioos-metadata-form-8d942 > firebase-functions/functions/emulator-data/database_export/cioos-metadata-form.json