# Multi-stage hardened container for OPERO Local Daemon & Web UI (optional CI/internal workspace)
FROM rust:1.85-slim AS rust-builder
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
RUN cargo build --release --bin opero-daemon

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tesseract-ocr && rm -rf /var/lib/apt/lists/* \
    && useradd -u 10001 -m -s /usr/sbin/nologin opero
WORKDIR /app
COPY --from=rust-builder /build/target/release/opero-daemon /usr/local/bin/opero-daemon
RUN mkdir -p /app/data && chown -R 10001:10001 /app
USER 10001
ENV OPERO_DATA_DIR=/app/data OPERO_DAEMON_PORT=4317 OPERO_OFFLINE_STRICT=true
EXPOSE 4317
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD ["/bin/sh", "-c", "exec 3<>/dev/tcp/127.0.0.1/4317"]
ENTRYPOINT ["/usr/local/bin/opero-daemon"]
