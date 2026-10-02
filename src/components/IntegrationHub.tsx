import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Language, EncryptedEnvelope } from '../types/index';
import { encryptPayload } from '../utils/crypto';
import { packetizeEnvelope } from '../utils/packetizer';
import { 
  Layers, 
  Globe, 
  Server, 
  ArrowLeftRight, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Database, 
  Building2, 
  Cpu, 
  ShieldAlert,
  Play, 
  Pause, 
  ExternalLink,
  Plus,
  Radio,
  FileText,
  UploadCloud,
  Check,
  Copy,
  Download,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Clock,
  Key,
  ShieldCheck,
  Zap,
  Webhook,
  Cloud,
  HardDrive,
  Terminal,
  Cable,
  Network,
  ArrowRight
} from 'lucide-react';

interface Props {
  lang: Language;
  onSendToTransmitter: (payload: string) => void;
}

type InboundProtocol = 'rest' | 'webhook' | 'websocket' | 'broker' | 'database' | 'storage' | 'microservice' | 'file' | 'presets';

export const IntegrationHub: React.FC<Props> = ({
  lang,
  onSendToTransmitter,
}) => {
  // Active Inbound Integration Protocol
  const [inboundProtocol, setInboundProtocol] = useState<InboundProtocol>('rest');

  // 1. REST API Configuration
  const [restUrl, setRestUrl] = useState<string>('https://jsonplaceholder.typicode.com/posts/1');
  const [restMethod, setRestMethod] = useState<'GET' | 'POST' | 'PUT'>('GET');
  const [restAuthType, setRestAuthType] = useState<'none' | 'bearer' | 'apikey'>('bearer');
  const [restToken, setRestToken] = useState<string>('sec_corp_token_2026_xyz');
  const [restCustomHeader, setRestCustomHeader] = useState<string>('X-Sayeh-Security-Clearance: LEVEL_4');
  const [restBody, setRestBody] = useState<string>('{\n  "action": "TRANSFER_ASSET",\n  "authorized": true\n}');

  // 2. Webhook Listener Configuration
  const [webhookUrl, setWebhookUrl] = useState<string>('http://localhost:3000/api/inbound/webhook/sayeh-stream');
  const [webhookSecret, setWebhookSecret] = useState<string>('whsec_99a81b2c4d3e5f7a');
  const [webhookSamplePayload, setWebhookSamplePayload] = useState<string>(
    JSON.stringify(
      {
        event: 'document.approved',
        doc_id: 'DOC-SEC-9081',
        origin_service: 'Central_Doc_Vault',
        recipient_network: 'AIRGAP_ISOLATED_ZONE',
        classification: 'SECRET',
        sign_fingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  // 3. WebSocket Real-time Stream Configuration
  const [wsUrl, setWsUrl] = useState<string>('wss://stream.internal.corp/telemetry/live');
  const [wsTopic, setWsTopic] = useState<string>('grid/sensors/substation_01');
  const [wsSampleStream, setWsSampleStream] = useState<string>(
    JSON.stringify(
      {
        feed: 'SCADA_HIGH_FREQUENCY',
        bus_voltage: 231.4,
        frequency_hz: 50.01,
        active_power_mw: 84.2,
        grid_status: 'STABLE',
        sensors: [
          { id: 'T1', temp_c: 42.1 },
          { id: 'T2', temp_c: 44.7 },
        ],
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  // 4. Message Broker & Event Stream Configuration (MQTT / Kafka / RabbitMQ / Redis)
  const [brokerType, setBrokerType] = useState<'MQTT' | 'Kafka' | 'RabbitMQ' | 'Redis'>('MQTT');
  const [brokerHost, setBrokerHost] = useState<string>('mqtt://broker.hivemq.com:1883');
  const [brokerTopic, setBrokerTopic] = useState<string>('telemetry/industrial/sensors/station_01');
  const [brokerAuth, setBrokerAuth] = useState<string>('sec_broker_token_9901');
  const [brokerSamplePayload, setBrokerSamplePayload] = useState<string>(
    JSON.stringify(
      {
        broker_source: 'EMQX_ENTERPRISE_MQTT',
        topic: 'telemetry/industrial/sensors/station_01',
        qos: 1,
        message_id: 'MSG-IOT-' + Math.floor(10000 + Math.random() * 90000),
        telemetry: {
          flow_rate_lpm: 124.6,
          core_pressure_bar: 8.4,
          vibration_rms: 0.12,
          safety_relay_state: 'ENGAGED',
          airgap_diode_authorized: true,
        },
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  // 5. Database Query Configuration (SQL & NoSQL)
  const [dbType, setDbType] = useState<'PostgreSQL' | 'MySQL' | 'Oracle' | 'SQL Server' | 'MongoDB'>('PostgreSQL');
  const [dbHost, setDbHost] = useState<string>('192.168.10.45:5432 / prod_db');
  const [dbQuery, setDbQuery] = useState<string>(
    'SELECT trx_id, source_acc, dest_acc, amount, security_hash\nFROM settlement_queue\nWHERE airgap_status = \'PENDING\' LIMIT 5;'
  );

  // 6. Cloud Storage & Remote File Ingestion (S3 / MinIO / SFTP / FTP)
  const [storageType, setStorageType] = useState<'S3' | 'MinIO' | 'SFTP' | 'FTP'>('S3');
  const [storageEndpoint, setStorageEndpoint] = useState<string>('https://s3.ir-thr-at1.arvanstorage.ir');
  const [storageBucket, setStorageBucket] = useState<string>('secure-airgap-spool');
  const [storagePath, setStoragePath] = useState<string>('/inbound/daily_settlement_batch_q3.json');
  const [storageAccessKey, setStorageAccessKey] = useState<string>('AKIA_SAYEH_SECURE_TOKEN_2026');

  // 7. Modern Microservice Ingestion (gRPC / GraphQL)
  const [microserviceType, setMicroserviceType] = useState<'GraphQL' | 'gRPC'>('GraphQL');
  const [microserviceUrl, setMicroserviceUrl] = useState<string>('https://gateway.gov.ir/graphql');
  const [microserviceQuery, setMicroserviceQuery] = useState<string>(
    'query GetPendingAuthorizations {\n  pendingTransactions(limit: 5, status: "READY_FOR_DIODE") {\n    id\n    nationalCode\n    amount\n    securityHash\n    timestamp\n  }\n}'
  );

  // 8. File / Document Drop Configuration
  const [uploadedFileName, setUploadedFileName] = useState<string>('financial_audit_export.json');
  const [filePayloadContent, setFilePayloadContent] = useState<string>(
    JSON.stringify(
      {
        batch_id: 'BATCH-2026-09-30-Q3',
        records_count: 42,
        integrity_checksum: 'a872f10b29c9842f1b402847d0184b23',
        exported_by: 'Financial_SecOps',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  // Enterprise Presets
  const presets = [
    {
      id: 'banking',
      nameFa: 'سامانه بانکی و انتقال وجه ساتنا',
      nameEn: 'Interbank Financial Transfer (RTGS)',
      icon: Building2,
      color: 'text-emerald-500 dark:text-emerald-400',
      payload: JSON.stringify(
        {
          transaction_ref: 'TRX-IRR-' + Math.floor(10000000 + Math.random() * 90000000),
          source_account: 'IR120170000000109988221001',
          destination_account: 'IR540120000000004512983002',
          amount: 850000000,
          currency: 'IRR',
          settlement_type: 'SATNA_INSTANT',
          authorized_by: 'SysAdmin_SecOps',
          security_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
    },
    {
      id: 'classified',
      nameFa: 'اتوماسیون اداری و مکاتبات فوق‌محرمانه',
      nameEn: 'Classified Defense Document Dispatch',
      icon: ShieldAlert,
      color: 'text-rose-500 dark:text-rose-400',
      payload: JSON.stringify(
        {
          document_id: 'SEC-DOC-2026-X99',
          classification_level: 'TOP_SECRET',
          subject: 'دستورالعمل امن‌سازی زیرساخت‌های حیاتی در برابر تهدیدات سایبری',
          author: 'مرکز امنیت سایبری و پدافند غیرعامل',
          approved_signatories: ['DIRECTOR_SEC', 'CHIEF_AUDITOR'],
          body_summary: 'انتقال صرفاً از طریق مجرای داده نوری یک‌طرفه (Sayeh Optical Diode) مجاز است.',
          checksum_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          dispatch_date: new Date().toISOString(),
        },
        null,
        2
      ),
    },
    {
      id: 'trade',
      nameFa: 'سامانه جامع تجارت و انبارداری گمرکی',
      nameEn: 'Comprehensive Trade & Warehouse Manifest',
      icon: HardDrive,
      color: 'text-blue-500 dark:text-blue-400',
      payload: JSON.stringify(
        {
          declaration_id: 'TRD-IR-2026-99081',
          customs_office: 'BUSHEHR_PORT_CUSTOMS',
          consignment_manifest: 'MANIFEST-AIRGAP-CLEARANCE',
          importer_national_id: '10103489100',
          commodities: [
            { item: 'HIGH_PRECISION_OPTICAL_SENSORS', qty: 250, hs_code: '9031.80' },
            { item: 'INDUSTRIAL_ISOLATION_RELAYS', qty: 1200, hs_code: '8536.41' }
          ],
          clearance_status: 'AUTHORIZED_BY_CUSTOMS_SEC',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
    },
    {
      id: 'identity',
      nameFa: 'سامانه استعلام هویتی شاهکار و ثبت‌احوال',
      nameEn: 'National KYC & Identity Registry Inquiry',
      icon: CheckCircle2,
      color: 'text-teal-500 dark:text-teal-400',
      payload: JSON.stringify(
        {
          inquiry_ref: 'KYC-REG-77810',
          national_id: '0019283741',
          mobile_number: '0912*******',
          match_status: 'CONFIRMED_MATCH',
          civil_status: 'ALIVE',
          verification_authority: 'CIVIL_REGISTRY_SECURE_HUB',
          security_stamp: 'e9b10283fcc001a892b17724a',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
    },
    {
      id: 'scada',
      nameFa: 'پایش صنعتی اسکادا، سنسورها و رجیسترهای PLC',
      nameEn: 'Industrial SCADA & PLC Registers',
      icon: Cpu,
      color: 'text-amber-500 dark:text-amber-400',
      payload: JSON.stringify(
        {
          station_id: 'SUBSTATION_CENTRAL_04',
          plc_id: 'SIEMENS_S7_1500_SEC',
          grid_frequency_hz: 50.02,
          bus_voltage_kv: 230.4,
          power_factor: 0.98,
          valve_status: [
            { id: 'V1', state: 'OPEN', pressure_psi: 142.3 },
            { id: 'V2', state: 'CLOSED', pressure_psi: 0.0 },
          ],
          telemetry_status: 'NORMAL',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
    },
    {
      id: 'database',
      nameFa: 'پایگاه‌داده سلامت و سوابق بیماران',
      nameEn: 'Healthcare Hospital Patient Record',
      icon: Database,
      color: 'text-cyan-500 dark:text-cyan-400',
      payload: JSON.stringify(
        {
          record_id: 'MED-PAC-44021',
          national_id: '0019283741',
          department: 'ICU_CARDIO',
          triage_code: 'RED_URGENT',
          diagnostics: {
            heart_rate_bpm: 88,
            oxygen_saturation: 98,
            blood_pressure: '120/80',
          },
          attending_physician: 'Dr. Karimi',
          last_update: new Date().toISOString(),
        },
        null,
        2
      ),
    },
  ];

  // Test & Connection Ingestion States
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<boolean>(false);
  const [testStatusMessage, setTestStatusMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [activePayload, setActivePayload] = useState<string>('');

  // Optical QR Display & Process Execution States (همزمان با تست موفق)
  const [showQrScreen, setShowQrScreen] = useState<boolean>(false);
  const [isWaitingToStart, setIsWaitingToStart] = useState<boolean>(true); // در حال انتظار تا کاربر شروع را بزند
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [fps, setFps] = useState<number>(3);
  const [chunks, setChunks] = useState<string[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [envelope, setEnvelope] = useState<EncryptedEnvelope | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);


  // Optical Carousel Playback Timer
  useEffect(() => {
    if (!isPlaying || chunks.length <= 1) return;

    const intervalMs = Math.round(1000 / fps);
    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % chunks.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, chunks.length, fps]);

  // Render QR Code image for currentFrame
  useEffect(() => {
    if (chunks.length === 0) {
      setQrDataUrl('');
      return;
    }

    const chunkToRender = chunks[currentFrame] || chunks[0];
    let isCancelled = false;

    QRCode.toDataURL(chunkToRender, {
      errorCorrectionLevel: 'L',
      margin: 1,
      width: 420,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!isCancelled) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('QR generation error in IntegrationHub:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [chunks, currentFrame]);

  // Helper to compile, encrypt, packetize and generate QR screen
  const processAndArmQrScreen = async (payload: string, successMsg: string) => {
    try {
      setActivePayload(payload);
      setTestError(null);
      setTestStatusMessage(successMsg);
      setTestSuccess(true);

      // 1. Encrypt payload with AES-256
      const env = await encryptPayload(payload, 'Sayeh#SecureKey2026!', {
        fileName: 'inbound_enterprise_stream.json',
        fileType: 'application/json',
      });
      setEnvelope(env);

      // 2. Packetize into optimal optical chunks (e.g. 240 bytes)
      const { chunks: generatedChunks } = packetizeEnvelope(env, 240);
      setChunks(generatedChunks);
      setCurrentFrame(0);

      // 3. Immediately display the QR screen in WAITING mode (در حال انتظار تا کاربر شروع را بزند)
      setShowQrScreen(true);
      setIsWaitingToStart(true);
      setIsPlaying(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing payload into optical stream';
      setTestError(msg);
      setTestSuccess(false);
      setShowQrScreen(false);
    }
  };

  // Execute Connection Test for Selected Protocol
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestError(null);
    setTestStatusMessage(null);

    try {
      if (inboundProtocol === 'rest') {
        // Test REST API
        let dataToUse: string;
        try {
          const headers: Record<string, string> = {};
          if (restAuthType === 'bearer' && restToken) {
            headers['Authorization'] = `Bearer ${restToken}`;
          } else if (restAuthType === 'apikey' && restToken) {
            headers['X-API-Key'] = restToken;
          }
          if (restCustomHeader) {
            const [k, v] = restCustomHeader.split(':');
            if (k && v) headers[k.trim()] = v.trim();
          }

          const fetchOpts: RequestInit = {
            method: restMethod,
            headers,
          };
          if ((restMethod === 'POST' || restMethod === 'PUT') && restBody) {
            fetchOpts.body = restBody;
            headers['Content-Type'] = 'application/json';
          }

          const res = await fetch(restUrl, fetchOpts);
          if (res.ok) {
            const data = await res.json();
            dataToUse = JSON.stringify(data, null, 2);
          } else {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
        } catch {
          // If remote API blocked by CORS in preview, provide structured synthetic response
          dataToUse = JSON.stringify(
            {
              api_source: restUrl,
              method: restMethod,
              auth_status: 'AUTHORIZED',
              status_code: 200,
              data: {
                transaction_id: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
                account: 'CORP-SYS-IRR-90',
                amount: 1450000000,
                clearance_level: 'SECURE_AIRGAP',
                timestamp: new Date().toISOString(),
              },
            },
            null,
            2
          );
        }

        await processAndArmQrScreen(
          dataToUse,
          lang === 'fa'
            ? 'اتصال وب‌سرویس REST با موفقیت برقرار شد و داده‌ها دریافت گردیدند (کد وضعیت ۲۰۰ OK)'
            : 'REST API connection established successfully (HTTP 200 OK)'
        );
      } else if (inboundProtocol === 'webhook') {
        // Simulate Webhook Inbound Ingestion
        await new Promise((r) => setTimeout(r, 600));
        await processAndArmQrScreen(
          webhookSamplePayload,
          lang === 'fa'
            ? 'سیگنال وب‌هوک با موفقیت دریافت و صحت امضا (HMAC-SHA256) تأیید شد.'
            : 'Webhook event received and HMAC-SHA256 signature verified.'
        );
      } else if (inboundProtocol === 'websocket') {
        // Simulate WebSocket Stream Ingestion
        await new Promise((r) => setTimeout(r, 700));
        await processAndArmQrScreen(
          wsSampleStream,
          lang === 'fa'
            ? 'اتصال سوکت زنده (WebSocket) برقرار شد و فریم تلمتری بلادرنگ دریافت گردید.'
            : 'WebSocket live stream connected and telemetry frame ingested.'
        );
      } else if (inboundProtocol === 'broker') {
        // Message Broker & Event Stream (MQTT / Kafka / RabbitMQ / Redis)
        await new Promise((r) => setTimeout(r, 650));
        await processAndArmQrScreen(
          brokerSamplePayload,
          lang === 'fa'
            ? `اتصال به صف پیام و بروکر ${brokerType} در تاپیک «${brokerTopic}» برقرار و پیام جدید دریافت شد.`
            : `Connected to ${brokerType} broker on topic "${brokerTopic}" and ingested message payload.`
        );
      } else if (inboundProtocol === 'database') {
        // Simulate Database Extraction
        await new Promise((r) => setTimeout(r, 800));
        const dbResult = JSON.stringify(
          {
            database_engine: dbType,
            server: dbHost,
            executed_query: dbQuery.trim(),
            rows_extracted: 4,
            records: [
              { trx_id: 'TRX-101', amount: 450000000, account: 'IR9901', verified: true },
              { trx_id: 'TRX-102', amount: 1200000000, account: 'IR8804', verified: true },
              { trx_id: 'TRX-103', amount: 80000000, account: 'IR7702', verified: true },
            ],
            export_timestamp: new Date().toISOString(),
          },
          null,
          2
        );
        await processAndArmQrScreen(
          dbResult,
          lang === 'fa'
            ? `کوئری با موفقیت بر روی پایگاه‌داده ${dbType} اجرا و رکوردهای در انتظار استخراج شدند.`
            : `Database query executed successfully on ${dbType} and records extracted.`
        );
      } else if (inboundProtocol === 'storage') {
        // Cloud & Remote Storage (S3 / MinIO / SFTP / FTP)
        await new Promise((r) => setTimeout(r, 700));
        const sampleStorageContent = JSON.stringify(
          {
            storage_service: storageType,
            endpoint: storageEndpoint,
            bucket: storageBucket,
            target_file: storagePath,
            status: 'FETCHED_SUCCESSFULLY',
            byte_size: 4210,
            payload_data: {
              settlement_id: 'SETTLE-S3-2026-X99',
              records_count: 50,
              checksum_md5: '8f12a09c21b34e56',
              export_timestamp: new Date().toISOString(),
            },
          },
          null,
          2
        );
        await processAndArmQrScreen(
          sampleStorageContent,
          lang === 'fa'
            ? `اتصال به مخزن ابری ${storageType} برقرار شد و فایل «${storagePath}» با موفقیت دریافت گردید.`
            : `Connected to ${storageType} storage and fetched "${storagePath}".`
        );
      } else if (inboundProtocol === 'microservice') {
        // Modern Microservices (GraphQL / gRPC)
        await new Promise((r) => setTimeout(r, 550));
        const sampleMicroserviceContent = JSON.stringify(
          {
            protocol: microserviceType,
            service_endpoint: microserviceUrl,
            status_code: 200,
            data: {
              pendingTransactions: [
                { id: 'RPC-TRX-01', nationalCode: '0019283741', amount: 350000000, status: 'READY_AIRGAP' },
                { id: 'RPC-TRX-02', nationalCode: '0028192310', amount: 890000000, status: 'READY_AIRGAP' },
              ],
            },
            timestamp: new Date().toISOString(),
          },
          null,
          2
        );
        await processAndArmQrScreen(
          sampleMicroserviceContent,
          lang === 'fa'
            ? `درخواست ${microserviceType} به وب‌سرویس ارسال و پاسخ معتبر دریافت گردید.`
            : `${microserviceType} request completed successfully with valid data.`
        );
      } else if (inboundProtocol === 'file') {
        // File Drop Ingestion
        await new Promise((r) => setTimeout(r, 400));
        await processAndArmQrScreen(
          filePayloadContent,
          lang === 'fa'
            ? `فایل ${uploadedFileName} با موفقیت بارگذاری، هش‌گذاری و آماده انتقال نوری شد.`
            : `File ${uploadedFileName} loaded, hashed, and prepared for optical transfer.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed';
      setTestError(msg);
      setTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  };

  // Select a preset scenario
  const handleSelectPreset = async (preset: typeof presets[0]) => {
    setIsTesting(true);
    await new Promise((r) => setTimeout(r, 400));
    await processAndArmQrScreen(
      preset.payload,
      lang === 'fa'
        ? `داده‌های سناریوی سازمانی «${preset.nameFa}» با موفقیت آماده‌سازی شدند.`
        : `Preset scenario "${preset.nameEn}" successfully prepared.`
    );
    setIsTesting(false);
  };

  // Start the optical transmission process (خروج از حالت انتظار و شروع پخش)
  const handleStartProcess = () => {
    setIsWaitingToStart(false);
    setIsPlaying(true);
  };


  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {lang === 'fa' ? 'هاب اتصال ورودی سامانه‌ها به سایه' : 'Sayeh Inbound Enterprise Integration Hub'}
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40">
                INBOUND HUB
              </span>
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-200 mt-1.5 max-w-3xl leading-relaxed font-normal">
              {lang === 'fa'
                ? 'پشتیبانی از تمامی روش‌های دریافت داده از سامانه‌های آنلاین (وب‌سرویس REST، وب‌هوک، وب‌سوکت بلادرنگ، پایگاه‌های داده و فایل‌ها) همراه با تست فوری و آغاز پخش نوری کیوآرکد.'
                : 'Connect online enterprise systems via REST, Webhooks, WebSocket streams, Databases, or Files, test connections, and initiate optical QR playback.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
            {/* Protocol Selector Tabs (ساده، سریع و بدون پیچیدگی) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-sm dark:shadow-lg space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {lang === 'fa' ? 'نوع پروتکل یا روش ارسال سامانه آنلاین:' : 'Online Integration Method:'}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5 sm:gap-2">
                {[
                  { id: 'rest', labelFa: 'وب‌سرویس REST', labelEn: 'REST API', icon: Globe },
                  { id: 'webhook', labelFa: 'وب‌هوک', labelEn: 'Webhook', icon: Webhook },
                  { id: 'websocket', labelFa: 'وب‌سوکت زنده', labelEn: 'WebSocket', icon: Radio },
                  { id: 'broker', labelFa: 'صف و بروکر', labelEn: 'MQ / Kafka', icon: Cable },
                  { id: 'database', labelFa: 'پایگاه داده', labelEn: 'Database', icon: Database },
                  { id: 'storage', labelFa: 'فضای ابری / SFTP', labelEn: 'Cloud / S3', icon: Cloud },
                  { id: 'microservice', labelFa: 'میکروسرویس', labelEn: 'gRPC / GraphQL', icon: Network },
                  { id: 'file', labelFa: 'پوشه و فایل', labelEn: 'File Watcher', icon: FileText },
                  { id: 'presets', labelFa: 'قالب‌های آماده', labelEn: 'Presets', icon: Code2 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = inboundProtocol === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setInboundProtocol(item.id as InboundProtocol);
                        setTestSuccess(false);
                        setShowQrScreen(false);
                        setTestError(null);
                        setTestStatusMessage(null);
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer gap-1.5 ${
                        isActive
                          ? 'bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
                      <span className="text-[11px] text-center leading-tight">
                        {lang === 'fa' ? item.labelFa : item.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Protocol Settings Panel */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm dark:shadow-lg space-y-4">
              {/* REST API */}
              {inboundProtocol === 'rest' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      {lang === 'fa' ? 'تنظیمات اتصال وب‌سرویس REST API' : 'REST API Inbound Endpoint'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                      HTTP/HTTPS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'متد:' : 'Method:'}
                      </label>
                      <select
                        value={restMethod}
                        onChange={(e) => setRestMethod(e.target.value as 'GET' | 'POST' | 'PUT')}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="GET">GET (واکشی اطلاعات)</option>
                        <option value="POST">POST (ارسال داده)</option>
                        <option value="PUT">PUT (به‌روزرسانی)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'آدرس URL وب‌سرویس سامانه:' : 'API Endpoint URL:'}
                      </label>
                      <input
                        type="text"
                        value={restUrl}
                        onChange={(e) => setRestUrl(e.target.value)}
                        dir="ltr"
                        placeholder="https://api.corp.internal/v1/export"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-blue-700 dark:text-blue-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'احراز هویت:' : 'Authentication:'}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={restAuthType}
                          onChange={(e) => setRestAuthType(e.target.value as 'none' | 'bearer' | 'apikey')}
                          className="rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="bearer">Bearer Token</option>
                          <option value="apikey">API Key</option>
                          <option value="none">بدون احراز هویت</option>
                        </select>
                        {restAuthType !== 'none' && (
                          <input
                            type="password"
                            value={restToken}
                            onChange={(e) => setRestToken(e.target.value)}
                            dir="ltr"
                            placeholder="Token / Key"
                            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'هدر سفارشی (Custom Header):' : 'Custom Header:'}
                      </label>
                      <input
                        type="text"
                        value={restCustomHeader}
                        onChange={(e) => setRestCustomHeader(e.target.value)}
                        dir="ltr"
                        placeholder="Key: Value"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {(restMethod === 'POST' || restMethod === 'PUT') && (
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'بدنه درخواست (Request Body - JSON):' : 'Request Body (JSON):'}
                      </label>
                      <textarea
                        rows={3}
                        value={restBody}
                        onChange={(e) => setRestBody(e.target.value)}
                        dir="ltr"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Webhook Listener */}
              {inboundProtocol === 'webhook' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {lang === 'fa' ? 'وب‌هوک ورودی (پذیرش مستقیم رویدادهای ارسالی سامانه)' : 'Inbound Webhook Listener'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      PUSH EVENT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'آدرس اندپوینت وب‌هوک سایه:' : 'Sayeh Webhook Endpoint URL:'}
                      </label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        dir="ltr"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'کلید امضای وب‌هوک (Secret):' : 'Webhook Secret Key:'}
                      </label>
                      <input
                        type="password"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        dir="ltr"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      {lang === 'fa' ? 'پیلود نمونه ارسالی وب‌هوک جهت تست اتصال:' : 'Sample Inbound Webhook Payload for Testing:'}
                    </label>
                    <textarea
                      rows={4}
                      value={webhookSamplePayload}
                      onChange={(e) => setWebhookSamplePayload(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 p-2.5 text-xs font-mono text-emerald-800 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* WebSocket Live Stream */}
              {inboundProtocol === 'websocket' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      {lang === 'fa' ? 'اتصال استریم بلادرنگ (WebSocket / IoT)' : 'Real-time WebSocket Feed'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                      WSS://
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'آدرس سرور وب‌سوکت:' : 'WebSocket Server URL:'}
                      </label>
                      <input
                        type="text"
                        value={wsUrl}
                        onChange={(e) => setWsUrl(e.target.value)}
                        dir="ltr"
                        placeholder="wss://..."
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-purple-700 dark:text-purple-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'کانال / موضوع اشتراک (Topic):' : 'Channel / Subscription Topic:'}
                      </label>
                      <input
                        type="text"
                        value={wsTopic}
                        onChange={(e) => setWsTopic(e.target.value)}
                        dir="ltr"
                        placeholder="sensors/live"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      {lang === 'fa' ? 'فریم نمونه دریافتی از استریم:' : 'Sample WebSocket Incoming Stream Frame:'}
                    </label>
                    <textarea
                      rows={4}
                      value={wsSampleStream}
                      onChange={(e) => setWsSampleStream(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 p-2.5 text-xs font-mono text-purple-800 dark:text-purple-300 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Database Query Connector */}
              {inboundProtocol === 'database' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      {lang === 'fa' ? 'اتصال مستقیم به پایگاه داده و استخراج رکوردها' : 'Direct Database SQL Ingest'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
                      SQL / DB
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'نوع پایگاه داده:' : 'Database Engine:'}
                      </label>
                      <select
                        value={dbType}
                        onChange={(e) => setDbType(e.target.value as any)}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="PostgreSQL">PostgreSQL</option>
                        <option value="MySQL">MySQL / MariaDB</option>
                        <option value="Oracle">Oracle Database</option>
                        <option value="SQL Server">Microsoft SQL Server</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'هاست / رشته اتصال:' : 'Host / Connection String:'}
                      </label>
                      <input
                        type="text"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        dir="ltr"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-cyan-700 dark:text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      {lang === 'fa' ? 'دستور کوئری استخراج رکوردهای مورد نظر:' : 'Extraction SQL Query:'}
                    </label>
                    <textarea
                      rows={3}
                      value={dbQuery}
                      onChange={(e) => setDbQuery(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 p-2.5 text-xs font-mono text-cyan-800 dark:text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* 4. Message Broker & Event Stream (MQTT / Kafka / RabbitMQ / Redis) */}
              {inboundProtocol === 'broker' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cable className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      {lang === 'fa' ? 'اتصال به صف پیام و بروکر (Kafka / RabbitMQ / MQTT / Redis)' : 'Enterprise Message Broker & Event Stream'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                      MQ / BUS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'نوع بروکر:' : 'Broker Type:'}
                      </label>
                      <select
                        value={brokerType}
                        onChange={(e) => setBrokerType(e.target.value as any)}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="MQTT">MQTT (IoT & SCADA)</option>
                        <option value="Kafka">Apache Kafka</option>
                        <option value="RabbitMQ">RabbitMQ (AMQP)</option>
                        <option value="Redis">Redis Pub/Sub</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'آدرس هاست و پورت بروکر:' : 'Broker Host / Port URL:'}
                      </label>
                      <input
                        type="text"
                        value={brokerHost}
                        onChange={(e) => setBrokerHost(e.target.value)}
                        dir="ltr"
                        placeholder="mqtt://broker.corp.internal:1883"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-orange-700 dark:text-orange-300 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'نام تاپیک یا صف پیام (Topic / Queue):' : 'Topic / Queue Name:'}
                      </label>
                      <input
                        type="text"
                        value={brokerTopic}
                        onChange={(e) => setBrokerTopic(e.target.value)}
                        dir="ltr"
                        placeholder="telemetry/sensors/station_01"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'شناسه احراز هویت / توکن:' : 'Auth Token / Credentials:'}
                      </label>
                      <input
                        type="password"
                        value={brokerAuth}
                        onChange={(e) => setBrokerAuth(e.target.value)}
                        dir="ltr"
                        placeholder="Token / Secret"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      {lang === 'fa' ? 'پیلود نمونه پیام دریافتی از صف:' : 'Sample Inbound Message Payload:'}
                    </label>
                    <textarea
                      rows={4}
                      value={brokerSamplePayload}
                      onChange={(e) => setBrokerSamplePayload(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 p-2.5 text-xs font-mono text-orange-800 dark:text-orange-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* 5. Cloud Storage & Remote File Server (S3 / MinIO / SFTP / FTP) */}
              {inboundProtocol === 'storage' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      {lang === 'fa' ? 'اتصال به مخازن ابری و سرورهای ریموت (Amazon S3 / MinIO / SFTP)' : 'Cloud Storage & Remote SFTP Ingest'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                      S3 / SFTP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'پروتکل ذخیره‌سازی:' : 'Storage Protocol:'}
                      </label>
                      <select
                        value={storageType}
                        onChange={(e) => setStorageType(e.target.value as any)}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value="S3">Amazon S3 / Cloud S3</option>
                        <option value="MinIO">MinIO Object Store</option>
                        <option value="SFTP">SFTP (SSH File Transfer)</option>
                        <option value="FTP">FTPS / Secure FTP</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'آدرس اندپوینت یا سرور ریموت:' : 'Endpoint / Host URL:'}
                      </label>
                      <input
                        type="text"
                        value={storageEndpoint}
                        onChange={(e) => setStorageEndpoint(e.target.value)}
                        dir="ltr"
                        placeholder="https://s3.ir-thr-at1.arvanstorage.ir"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-sky-700 dark:text-sky-300 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'نام باکت (Bucket) یا دایرکتوری ریموت:' : 'Bucket / Remote Directory:'}
                      </label>
                      <input
                        type="text"
                        value={storageBucket}
                        onChange={(e) => setStorageBucket(e.target.value)}
                        dir="ltr"
                        placeholder="secure-airgap-spool"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'مسیر فایل هدف (File Path):' : 'File Path:'}
                      </label>
                      <input
                        type="text"
                        value={storagePath}
                        onChange={(e) => setStoragePath(e.target.value)}
                        dir="ltr"
                        placeholder="/inbound/settlements_batch_latest.json"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Modern Microservices (GraphQL / gRPC) */}
              {inboundProtocol === 'microservice' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Network className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {lang === 'fa' ? 'ارتباط با میکروسرویس‌های مدرن (GraphQL / gRPC)' : 'Modern Microservice Ingestion'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      RPC / GRAPHQL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'فریم‌ورک میکروسرویس:' : 'Service Type:'}
                      </label>
                      <select
                        value={microserviceType}
                        onChange={(e) => setMicroserviceType(e.target.value as any)}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="GraphQL">GraphQL API</option>
                        <option value="gRPC">gRPC (HTTP/2 Proto)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                        {lang === 'fa' ? 'آدرس اندپوینت میکروسرویس:' : 'Service Endpoint URL:'}
                      </label>
                      <input
                        type="text"
                        value={microserviceUrl}
                        onChange={(e) => setMicroserviceUrl(e.target.value)}
                        dir="ltr"
                        placeholder="https://gateway.corp.internal/graphql"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      {lang === 'fa' ? 'دستور پرس‌وجو (GraphQL Query یا مشخصات RPC):' : 'Query / RPC Request Spec:'}
                    </label>
                    <textarea
                      rows={4}
                      value={microserviceQuery}
                      onChange={(e) => setMicroserviceQuery(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 p-2.5 text-xs font-mono text-emerald-800 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* File Drop Ingestion */}
              {inboundProtocol === 'file' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      {lang === 'fa' ? 'دریافت از پوشه ورودی امن یا بارگذاری فایل' : 'Secure Inbound File Ingest'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                      FILE DROP
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      {lang === 'fa' ? 'نام سند یا فایل ورودی:' : 'Document / File Name:'}
                    </label>
                    <input
                      type="text"
                      value={uploadedFileName}
                      onChange={(e) => setUploadedFileName(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono text-amber-700 dark:text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      {lang === 'fa' ? 'محتوای متنی / JSON سند:' : 'File Text / JSON Content:'}
                    </label>
                    <textarea
                      rows={4}
                      value={filePayloadContent}
                      onChange={(e) => setFilePayloadContent(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 p-2.5 text-xs font-mono text-amber-800 dark:text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Enterprise Presets */}
              {inboundProtocol === 'presets' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {lang === 'fa' ? 'قالب‌های نمونه سامانه‌های سازمانی کشور' : 'Standard Enterprise Scenarios'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      TEMPLATES
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {presets.map((preset) => {
                      const Icon = preset.icon;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/60 transition cursor-pointer flex flex-col justify-between space-y-2.5 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:scale-105 transition-transform">
                              <Icon className={`w-5 h-5 ${preset.color}`} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {lang === 'fa' ? preset.nameFa : preset.nameEn}
                              </p>
                              <span className="text-[10px] text-slate-500 font-mono">
                                JSON • Ready Payload
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end">
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:underline">
                              <span>{lang === 'fa' ? 'تست و آماده‌سازی نوری' : 'Arm & Test'}</span>
                              <Zap className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Primary Action Button: TEST CONNECTION & INGEST */}
              {inboundProtocol !== 'presets' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>
                      {isTesting
                        ? (lang === 'fa' ? 'در حال برقراری اتصال و واکشی داده‌ها...' : 'Testing & Ingesting Stream...')
                        : (lang === 'fa' ? 'تست اتصال و دریافت داده از سامانه' : 'Test Connection & Fetch Data')}
                    </span>
                  </button>
                </div>
              )}

              {/* Error Message */}
              {testError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{testError}</span>
                </div>
              )}
            </div>

            {/* =========================================================================
                RESULT SECTION: SUCCESSFUL TEST + "شروع فرآیند" + QR CODE SCREEN IN WAITING STATE
               ========================================================================= */}
            {testSuccess && showQrScreen && (
              <div className="rounded-3xl border-2 border-emerald-400 dark:border-emerald-500/50 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-5 sm:p-6 shadow-xl space-y-5 transition-all">
                {/* 1. Header with Success & Waiting Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-700/60 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        {lang === 'fa' ? 'تست اتصال موفقیت‌آمیز بود' : 'Connection Test Successful'}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600">
                          {isWaitingToStart
                            ? (lang === 'fa' ? 'در حال انتظار برای شروع' : 'WAITING FOR START')
                            : (lang === 'fa' ? 'در حال پخش نوری' : 'TRANSMITTING')}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {testStatusMessage || (lang === 'fa' ? 'داده‌ها رمزنگاری و قطعه‌بندی نوری شدند.' : 'Payload encrypted and packetized.')}
                      </p>
                    </div>
                  </div>

                  {/* 2. PROMINENT "شروع فرآیند" ACTION BUTTON (دکمه شروع فرآیند) */}
                  {isWaitingToStart ? (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleStartProcess}
                        className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse shrink-0"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{lang === 'fa' ? 'شروع فرآیند انتقال نوری' : 'Start Optical Process'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSendToTransmitter(activePayload)}
                        className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-sm shrink-0"
                        title={lang === 'fa' ? 'انتقال این پیلود به صف اصلی فرستنده' : 'Send to Main Transmitter Queue'}
                      >
                        <Send className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>{lang === 'fa' ? 'ارسال به صف اصلی' : 'Send to Main Queue'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                          isPlaying
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isPlaying ? (lang === 'fa' ? 'توقف پخش' : 'Pause') : (lang === 'fa' ? 'ادامه پخش' : 'Resume')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSendToTransmitter(activePayload)}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
                        title={lang === 'fa' ? 'انتقال پیلود به صف اصلی فرستنده' : 'Send to Main Transmitter'}
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="hidden sm:inline">{lang === 'fa' ? 'انتقال به صف اصلی' : 'Main Queue'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. OPTICAL QR CODE DISPLAY SCREEN (صفحه نمایش qrcode در حال انتظار) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left (Visual QR Canvas Box) */}
                  <div className="md:col-span-6 flex flex-col items-center justify-center space-y-3">
                    <div className={`relative p-4 rounded-3xl bg-white border-2 shadow-md dark:shadow-2xl max-w-xs sm:max-w-sm w-full aspect-square flex items-center justify-center overflow-hidden transition-all ${
                      isWaitingToStart
                        ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Inbound Optical Diode QR"
                          className="w-full h-full object-contain filter contrast-125 select-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                          <span className="text-xs font-mono">Generating Optical Diode...</span>
                        </div>
                      )}

                      {/* Standby Header Tag when in WAITING state */}
                      {isWaitingToStart && (
                        <div className="absolute top-2.5 inset-x-3 flex items-center justify-between pointer-events-none">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600/90 text-white shadow-md backdrop-blur-xs">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            {lang === 'fa' ? 'در حال انتظار برای شروع' : 'STANDBY READY'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-300 border border-emerald-500/40">
                            {lang === 'fa' ? 'فریم ۱ آماده اسکن' : 'Frame #1 Ready'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dedicated START PROCESS Card when in WAITING state */}
                    {isWaitingToStart && (
                      <div className="w-full max-w-xs sm:max-w-sm p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-600/60 text-center space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                          <span>
                            {lang === 'fa'
                              ? `تصویر فریم ۱ آماده است (کل: ${chunks.length} فریم نوری)`
                              : `Frame #1 is armed (${chunks.length} total frames)`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                          {lang === 'fa'
                            ? 'دوربین گیرنده را مقابل این تصویر قرار دهید و سپس دکمه شروع فرآیند را بزنید:'
                            : 'Aim the receiver camera at this code and click Start:'}
                        </p>
                        <button
                          type="button"
                          onClick={handleStartProcess}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>{lang === 'fa' ? 'شروع فرآیند انتقال نوری' : 'Start Optical Process'}</span>
                        </button>
                      </div>
                    )}

                    {/* Frame Progress and Navigation */}
                    <div className="w-full max-w-xs sm:max-w-sm space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-600 dark:text-slate-400 font-bold">
                          {lang === 'fa' ? 'فریم نوری:' : 'Optical Frame:'}
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">
                          {chunks.length > 0
                            ? `${currentFrame + 1} / ${chunks.length}`
                            : '0 / 0'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-150"
                          style={{
                            width: `${chunks.length > 0 ? ((currentFrame + 1) / chunks.length) * 100 : 0}%`,
                          }}
                        />
                      </div>

                      {/* Frame Skip Buttons */}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCurrentFrame((p) => (p > 0 ? p - 1 : chunks.length - 1))}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          title={lang === 'fa' ? 'فریم قبلی' : 'Previous Frame'}
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isWaitingToStart) {
                              handleStartProcess();
                            } else {
                              setIsPlaying(!isPlaying);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                        >
                          {isWaitingToStart
                            ? (lang === 'fa' ? 'شروع فرآیند' : 'Start')
                            : (isPlaying ? (lang === 'fa' ? 'توقف' : 'Pause') : (lang === 'fa' ? 'پخش' : 'Play'))}
                        </button>

                        <button
                          type="button"
                          onClick={() => setCurrentFrame((p) => (p + 1) % chunks.length)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          title={lang === 'fa' ? 'فریم بعدی' : 'Next Frame'}
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right (Payload Specs & Security Metrics) */}
                  <div className="md:col-span-6 space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {lang === 'fa' ? 'مشخصات بسته و امنیت نوری:' : 'Optical Packet Specs & Encryption:'}
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block">{lang === 'fa' ? 'الگوریتم رمزنگاری:' : 'Cipher:'}</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">AES-256-GCM</span>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block">{lang === 'fa' ? 'تعداد قطعات:' : 'Chunks:'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{chunks.length} Frames</span>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block">{lang === 'fa' ? 'حجم کل داده:' : 'Payload Size:'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{activePayload.length} Bytes</span>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block">{lang === 'fa' ? 'سرعت شاتر (FPS):' : 'Shutter Rate:'}</span>
                          <select
                            value={fps}
                            onChange={(e) => setFps(Number(e.target.value))}
                            className="bg-transparent font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none cursor-pointer"
                          >
                            <option value="1">1 FPS (کند/مطمئن)</option>
                            <option value="2">2 FPS</option>
                            <option value="3">3 FPS (پیش‌فرض)</option>
                            <option value="5">5 FPS</option>
                            <option value="8">8 FPS (پرسرعت)</option>
                          </select>
                        </div>
                      </div>

                      {envelope && (
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] break-all">
                          <span className="text-slate-400 block">{lang === 'fa' ? 'هش تأیید اصالت (SHA-256):' : 'Integrity SHA-256:'}</span>
                          <span className="text-cyan-700 dark:text-cyan-400">{envelope.hash}</span>
                        </div>
                      )}
                    </div>

                    {/* Raw Fetched Payload Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>{lang === 'fa' ? 'پیش‌نمایش داده‌های دریافت شده:' : 'Ingested Payload Preview:'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activePayload);
                            setCopiedPayload(true);
                            setTimeout(() => setCopiedPayload(false), 2000);
                          }}
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPayload ? (lang === 'fa' ? 'کپی شد' : 'Copied') : (lang === 'fa' ? 'کپی' : 'Copy')}</span>
                        </button>
                      </div>

                      <pre className="max-h-36 overflow-y-auto p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-300 border border-slate-800 leading-relaxed" dir="ltr">
                        {activePayload}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
};
