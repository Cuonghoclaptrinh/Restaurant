// src/tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const exporterUrl =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces';

const serviceName = process.env.OTEL_SERVICE_NAME || 'node-service';

const traceExporter = new OTLPTraceExporter({ url: exporterUrl });

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

try {
    sdk.start();
    console.log(`✅ OpenTelemetry tracing initialized for ${serviceName}`);
} catch (error) {
    console.error('❌ Error initializing OpenTelemetry SDK', error);
}

process.on('SIGTERM', () => {
    sdk
        .shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.error('Error terminating tracing', error))
        .finally(() => process.exit(0));
});
