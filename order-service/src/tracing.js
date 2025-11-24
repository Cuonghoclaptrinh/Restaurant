// src/tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// Exporter gửi trace sang Jaeger
const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
});

// Khởi tạo SDK
const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-http': { enabled: true },
            '@opentelemetry/instrumentation-express': { enabled: true },
            '@opentelemetry/instrumentation-sequelize': { enabled: true },
        }),
    ],
});

// ⚠️ start() ở version hiện tại không trả Promise → gọi thẳng
try {
    sdk.start();
    console.log('✅ OpenTelemetry tracing initialized for order-service');
} catch (error) {
    console.error('❌ Error initializing OpenTelemetry SDK', error);
}

// Đảm bảo shutdown gọn khi container dừng
process.on('SIGTERM', () => {
    sdk
        .shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.error('Error terminating tracing', error))
        .finally(() => process.exit(0));
});
