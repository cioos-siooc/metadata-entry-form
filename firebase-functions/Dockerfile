FROM node:lts-alpine AS app-env

# Install Python and Java and pre-cache emulator dependencies.
RUN apk add --no-cache python3 py3-pip openjdk11-jre bash && \
    npm install -g firebase-tools && \
    firebase setup:emulators:database && \
    firebase setup:emulators:firestore && \
    firebase setup:emulators:pubsub && \
    firebase setup:emulators:storage && \
    firebase setup:emulators:ui && \
    rm -rf /var/cache/apk/*

WORKDIR /app

ADD ./entrypoint.sh /app/entrypoint.sh
RUN chmod 755 entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]

# ENTRYPOINT [ "firebase", "--project=cioos-metadata-form", "emulators:start", "--only", "firestore,database,functions,auth", "--import", "./backup"]
# ENTRYPOINT [ "firebase", "--project=cioos-metadata-form", "--debug", "emulators:start", "--only", "firestore,database,functions,auth", "--import", "./backup"]
# ENTRYPOINT [ "firebase", "--project=cioos-metadata-form", "emulators:start", "--only", "firestore,database,functions,auth", "--import", "./backup", "--export-on-exit", "./backup"]

# firebase --project=cioos-metadata-form emulators:export ./backup