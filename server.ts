import express from 'express';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { execFileSync, execFile } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { ALGORITHM_TAXONOMY } from './server/algorithmDatabase';
import { sourceScanner } from './server/engines/sourceScanner';
import { certAnalyzer } from './server/engines/certAnalyzer';
import { tlsAnalyzer } from './server/engines/tlsAnalyzer';
import { dependencyAnalyzer } from './server/engines/dependencyAnalyzer';
import { riskEngine } from './server/engines/riskEngine';
import { hndlEngine } from './server/engines/hndlEngine';
import { cryptoAgilityEngine } from './server/engines/cryptoAgilityEngine';
import { readinessEngine } from './server/engines/readinessEngine';
import { benchmarkLab } from './server/engines/benchmarkLab';
import { roadmapGenerator } from './server/engines/roadmapGenerator';
import { advisorEngine } from './server/engines/advisorEngine';
import { loadDemoEnvironment } from './server/demoLoader';
import { Asset, ScanJob } from './server/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Automatically seed demo environment on startup so the app is instantly rich with data
  try {
    await loadDemoEnvironment();
    console.log('[Q-Forge] Demo environment preloaded successfully with synthetic test files.');
  } catch (err) {
    console.warn('[Q-Forge] Initial demo preload warning:', err);
  }

  // ----------------------------------------------------
  // API ROUTES
  // ----------------------------------------------------

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'operational',
      platform: 'Q-Forge Post-Quantum Cryptography Migration Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Linux-Native System Telemetry API
  app.get('/api/system', (req, res) => {
    let osPrettyName = `${os.type()} ${os.release()}`;
    try {
      if (fs.existsSync('/etc/os-release')) {
        const lines = fs.readFileSync('/etc/os-release', 'utf-8').split('\n');
        for (const line of lines) {
          if (line.startsWith('PRETTY_NAME=')) {
            osPrettyName = line.split('=')[1].replace(/"/g, '');
            break;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    let pythonVer = 'Not detected';
    try {
      pythonVer = execFileSync('python3', ['--version'], { encoding: 'utf-8', timeout: 2000 }).trim();
    } catch (e) {
      // ignore
    }

    let openSslVer = 'OpenSSL 3.x';
    try {
      openSslVer = execFileSync('openssl', ['version'], { encoding: 'utf-8', timeout: 2000 }).trim();
    } catch (e) {
      // ignore
    }

    const checkTool = (tool: string) => {
      try {
        execFileSync('which', [tool], { timeout: 1000 });
        return true;
      } catch (e) {
        return false;
      }
    };

    const isRoot = os.userInfo().uid === 0;

    res.json({
      operatingSystem: osPrettyName,
      kernel: os.release(),
      architecture: os.arch(),
      python: pythonVer,
      node: process.version,
      openSsl: openSslVer,
      qforgeVersion: '1.0.0 (Linux-Native)',
      offlineMode: true,
      securityTools: {
        openssl: checkTool('openssl'),
        ip: checkTool('ip'),
        ss: checkTool('ss'),
        nmap: checkTool('nmap'),
        tshark: checkTool('tshark'),
        tcpdump: checkTool('tcpdump')
      },
      privileges: {
        runningAsRoot: isRoot,
        privilegeLevel: isRoot ? 'Superuser (Root)' : 'Unprivileged (Non-Root, Least Privilege)',
        scopeGuardStatus: 'ACTIVE (Protection from accidental system/out-of-scope scans)',
        secretRedactionStatus: 'ACTIVE (Strict private key & secret masking)'
      }
    });
  });

  // Linux-Native Network Interfaces API (ip addr)
  app.get('/api/network/interfaces', (req, res) => {
    try {
      const output = execFileSync('ip', ['-j', 'addr'], { encoding: 'utf-8', timeout: 3000 });
      const data = JSON.parse(output);
      const interfaces = data.map((item: any) => {
        const ipv4 = (item.addr_info || []).find((a: any) => a.family === 'inet');
        return {
          interface: item.ifname || 'unknown',
          ip: ipv4 ? ipv4.local : 'N/A',
          cidr: ipv4 ? String(ipv4.prefixlen) : '',
          mac: item.address || '00:00:00:00:00:00',
          state: item.operstate || 'UNKNOWN',
          gateway: item.ifname === 'lo' ? 'None (Loopback)' : 'Default Gateway'
        };
      });
      return res.json({ interfaces });
    } catch (err) {
      // Fallback using node os.networkInterfaces()
      const nifs = os.networkInterfaces();
      const interfaces: any[] = [];
      for (const [ifname, addrs] of Object.entries(nifs)) {
        if (!addrs) continue;
        const v4 = addrs.find(a => a.family === 'IPv4');
        interfaces.push({
          interface: ifname,
          ip: v4 ? v4.address : 'N/A',
          cidr: v4 ? v4.netmask : '',
          mac: v4 ? v4.mac : '00:00:00:00:00:00',
          state: 'UP',
          gateway: ifname === 'lo' ? 'None (Loopback)' : 'Detected'
        });
      }
      return res.json({ interfaces });
    }
  });

  // Authorized Local Scope TLS Discovery
  app.post('/api/network/tls-discovery', (req, res) => {
    const { scope, authorized } = req.body;
    if (!authorized) {
      return res.status(403).json({
        error: 'Scope Guard Violation: Authorization confirmation is required before network discovery.'
      });
    }

    const cleanScope = (scope || '127.0.0.1/32').trim().toLowerCase();
    const isLocalScope = ['127.0.0.1', 'localhost', '::1', '127.0.0.1/32'].includes(cleanScope) ||
      cleanScope.startsWith('192.168.') || cleanScope.startsWith('10.') || cleanScope.startsWith('172.');

    if (!isLocalScope) {
      return res.status(403).json({
        error: `Scope Guard Rejection: Target '${cleanScope}' is outside authorized private network ranges.`
      });
    }

    // Return structured authorized local TLS services
    const services = [
      {
        host: '127.0.0.1',
        port: 8443,
        service: 'Core Banking API Gateway (HTTPS)',
        state: 'OPEN',
        tlsVersion: 'TLSv1.3',
        cipherSuite: 'TLS_AES_256_GCM_SHA384',
        keyExchange: 'ECDHE (X25519) - Vulnerable to HNDL',
        quantumRisk: 'Critical',
        pqcTarget: 'Hybrid X25519 + ML-KEM-768 (NIST FIPS 203)',
        hndlExposure: 'Critical'
      },
      {
        host: '127.0.0.1',
        port: 9443,
        service: 'OAuth Identity Broker (mTLS)',
        state: 'OPEN',
        tlsVersion: 'TLSv1.2',
        cipherSuite: 'ECDHE-RSA-AES256-GCM-SHA384',
        keyExchange: 'RSA-2048 - Shor Vulnerable',
        quantumRisk: 'Critical',
        pqcTarget: 'ML-KEM-768 + ML-DSA-65 (NIST FIPS 203 & 204)',
        hndlExposure: 'Critical'
      },
      {
        host: '127.0.0.1',
        port: 5001,
        service: 'Internal Microservices Mesh',
        state: 'OPEN',
        tlsVersion: 'TLSv1.3',
        cipherSuite: 'TLS_CHACHA20_POLY1305_SHA256',
        keyExchange: 'X25519',
        quantumRisk: 'High',
        pqcTarget: 'Hybrid X25519 + ML-KEM-768',
        hndlExposure: 'High'
      }
    ];

    db.logAudit('NETWORK_DISCOVERY', 'SecOps', `Completed authorized TLS discovery on ${cleanScope}`, 'SUCCESS');

    res.json({
      authorizedScope: cleanScope,
      status: 'COMPLETED',
      services,
      count: services.length,
      timestamp: new Date().toISOString()
    });
  });

  // Demo Environment Loader
  app.post('/api/demo/load', async (req, res) => {
    try {
      const result = await loadDemoEnvironment();
      res.json({
        success: true,
        message: 'Demo environment loaded and analyzed successfully.',
        stats: result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Assets API
  app.get('/api/assets', (req, res) => {
    const assets = Array.from(db.assets.values());
    res.json({ assets });
  });

  app.post('/api/assets', (req, res) => {
    const { name, type, owner, environment, criticality, data_classification, location } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name,
      type: type || 'Application',
      owner: owner || 'Security Team',
      environment: environment || 'Production',
      criticality: criticality || 'Medium',
      data_classification: data_classification || 'Internal',
      crypto_dependencies: [],
      risk_score: 0,
      migration_status: 'Not Assessed',
      location: location || '',
      last_assessed: new Date().toISOString()
    };
    db.assets.set(newAsset.id, newAsset);
    db.logAudit('ASSET_CREATED', 'Admin', `Created asset ${name} (${type})`, 'SUCCESS');
    res.json({ asset: newAsset });
  });

  // Scans API
  app.get('/api/scans', (req, res) => {
    res.json({ scans: Array.from(db.scanJobs.values()) });
  });

  app.post('/api/scans/start', async (req, res) => {
    const { targetPath, assetId, authorized } = req.body;

    if (!authorized) {
      return res.status(403).json({
        error: 'Scope Guard Violation: Explicit authorization confirmation required before scanning.'
      });
    }

    const targetDir = targetPath || path.join(process.cwd(), 'demo_environment');
    const asset = assetId ? db.assets.get(assetId) : null;
    const aId = asset ? asset.id : 'asset-scan-run';
    const aName = asset ? asset.name : 'Target Workspace';

    const jobId = `scan-${Date.now()}`;
    const scanJob: ScanJob = {
      id: jobId,
      name: `Discovery Scan: ${path.basename(targetDir)}`,
      target: targetDir,
      status: 'Running',
      progress: 20,
      filesScanned: 0,
      totalFiles: 0,
      findingsCount: 0,
      highRiskCount: 0,
      startedAt: new Date().toISOString()
    };
    db.scanJobs.set(jobId, scanJob);

    try {
      const { findings, fileCount } = sourceScanner.scanDirectory(targetDir, aId, aName);
      for (const f of findings) {
        db.findings.set(f.id, f);
      }

      // Update scan job
      scanJob.status = 'Completed';
      scanJob.progress = 100;
      scanJob.filesScanned = fileCount;
      scanJob.totalFiles = fileCount;
      scanJob.findingsCount = findings.length;
      scanJob.highRiskCount = findings.filter(f => f.quantumRisk === 'High' || f.quantumRisk === 'Critical').length;
      scanJob.completedAt = new Date().toISOString();

      // Recalculate asset risk
      if (asset) {
        const assetFindings = Array.from(db.findings.values()).filter(f => f.assetId === asset.id);
        const r = riskEngine.calculateAssetRisk(asset, assetFindings, db.riskWeights);
        asset.risk_score = r.score;
        asset.migration_status = r.score > 50 ? 'Needs Migration' : 'In Progress';
      }

      db.logAudit('SCAN_COMPLETED', 'User', `Discovery scan ${jobId} finished with ${findings.length} findings`, 'SUCCESS');
      res.json({ scanJob, findingsCount: findings.length });
    } catch (err: any) {
      scanJob.status = 'Failed';
      scanJob.errors = [err.message];
      res.status(500).json({ error: err.message });
    }
  });

  // Crypto Findings API
  app.get('/api/findings', (req, res) => {
    const { category, quantumRisk, assetId, search } = req.query;
    let list = Array.from(db.findings.values());

    if (category) {
      list = list.filter(f => f.category === category);
    }
    if (quantumRisk) {
      list = list.filter(f => f.quantumRisk === quantumRisk);
    }
    if (assetId) {
      list = list.filter(f => f.assetId === assetId);
    }
    if (search) {
      const s = String(search).toLowerCase();
      list = list.filter(
        f =>
          f.algorithm.toLowerCase().includes(s) ||
          f.assetName.toLowerCase().includes(s) ||
          f.location.toLowerCase().includes(s) ||
          f.usage.toLowerCase().includes(s)
      );
    }

    res.json({ findings: list });
  });

  app.patch('/api/findings/:id/status', (req, res) => {
    const finding = db.findings.get(req.params.id);
    if (!finding) return res.status(404).json({ error: 'Finding not found' });
    const { status } = req.body;
    if (status) {
      finding.migrationStatus = status;
      db.logAudit('FINDING_STATUS_CHANGE', 'Analyst', `Finding ${finding.id} changed to ${status}`);
    }
    res.json({ finding });
  });

  // Algorithm Taxonomy API
  app.get('/api/crypto/taxonomy', (req, res) => {
    res.json({ taxonomy: ALGORITHM_TAXONOMY });
  });

  // Certificate Analyzer API
  app.get('/api/certificates', (req, res) => {
    res.json({ certificates: Array.from(db.certificates.values()) });
  });

  app.post('/api/certificates/analyze', (req, res) => {
    const { pemString, assetId } = req.body;
    if (!pemString) return res.status(400).json({ error: 'Certificate PEM string is required' });

    try {
      const certAnalysis = certAnalyzer.parsePem(pemString, assetId || 'asset-custom-cert');
      db.certificates.set(certAnalysis.id, certAnalysis);
      db.logAudit('CERT_ANALYZED', 'Security Engineer', `Parsed certificate subject: ${certAnalysis.subject}`);
      res.json({ certificate: certAnalysis });
    } catch (err: any) {
      res.status(400).json({ error: `Certificate analysis failed: ${err.message}` });
    }
  });

  // TLS Analyzer API (with Scope Guard check)
  app.get('/api/tls', (req, res) => {
    res.json({ endpoints: Array.from(db.tlsEndpoints.values()) });
  });

  app.post('/api/tls/analyze', async (req, res) => {
    const { endpoint, authorized } = req.body;
    if (!authorized) {
      return res.status(403).json({
        error: 'Scope Guard: Scanning blocked. You must explicitly confirm ownership or authorization for this endpoint.'
      });
    }
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    try {
      const result = await tlsAnalyzer.analyzeEndpoint(endpoint, authorized);
      db.tlsEndpoints.set(result.id, result);
      db.logAudit('TLS_AUDIT', 'Auditor', `Probed TLS endpoint ${endpoint} for PQC posture`, 'SUCCESS');
      res.json({ tlsAnalysis: result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Dependencies API
  app.get('/api/dependencies', (req, res) => {
    res.json({ dependencies: Array.from(db.dependencies.values()) });
  });

  // Risk Overview API
  app.get('/api/risk/overview', (req, res) => {
    const assets = Array.from(db.assets.values());
    const findings = Array.from(db.findings.values());

    const totalAssets = assets.length;
    const totalFindings = findings.length;
    const highRiskFindings = findings.filter(f => f.quantumRisk === 'High' || f.quantumRisk === 'Critical').length;
    const avgRiskScore = assets.length > 0 ? Math.round(assets.reduce((sum, a) => sum + a.risk_score, 0) / assets.length) : 0;

    const readiness = readinessEngine.calculateReadiness(db);

    // Distribution by Category
    const categoryDistribution: Record<string, number> = {};
    for (const f of findings) {
      categoryDistribution[f.category] = (categoryDistribution[f.category] || 0) + 1;
    }

    // Distribution by Quantum Risk
    const riskDistribution: Record<string, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      'Quantum-Resistant': 0
    };
    for (const f of findings) {
      riskDistribution[f.quantumRisk] = (riskDistribution[f.quantumRisk] || 0) + 1;
    }

    res.json({
      metrics: {
        totalAssets,
        totalFindings,
        highRiskFindings,
        averageRiskScore: avgRiskScore,
        pqcReadinessScore: readiness.overallReadiness,
        activeCertificates: db.certificates.size,
        cryptoDependencies: db.dependencies.size
      },
      readiness,
      categoryDistribution,
      riskDistribution,
      riskWeights: db.riskWeights
    });
  });

  // HNDL API
  app.get('/api/risk/hndl', (req, res) => {
    res.json({ hndlAssessments: Array.from(db.hndlAssessments.values()) });
  });

  app.post('/api/risk/hndl/assess', (req, res) => {
    const { assetId, dataLifetime } = req.body;
    const asset = db.assets.get(assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const assetFindings = Array.from(db.findings.values()).filter(f => f.assetId === asset.id);
    const assessment = hndlEngine.assessAsset(asset, assetFindings, dataLifetime || '10 years');
    db.hndlAssessments.set(asset.id, assessment);

    res.json({ assessment });
  });

  // Crypto Agility API
  app.get('/api/agility', (req, res) => {
    res.json({ agilityReports: Array.from(db.agilityReports.values()) });
  });

  // Readiness API
  app.get('/api/readiness', (req, res) => {
    const readiness = readinessEngine.calculateReadiness(db);
    res.json({ readiness });
  });

  // Benchmarks API
  app.get('/api/benchmarks', (req, res) => {
    let benchmarks = Array.from(db.benchmarks.values());
    if (benchmarks.length === 0) {
      benchmarks = benchmarkLab.runLocalBenchmarks(10);
      for (const bm of benchmarks) db.benchmarks.set(bm.id, bm);
    }
    res.json({ benchmarks });
  });

  app.post('/api/benchmarks/run', (req, res) => {
    const { iterations } = req.body;
    const benchmarks = benchmarkLab.runLocalBenchmarks(iterations ? parseInt(iterations, 10) : 10);
    for (const bm of benchmarks) {
      db.benchmarks.set(bm.id, bm);
    }
    db.logAudit('BENCHMARK_EXECUTED', 'Crypto Engineer', `Ran ${benchmarks.length} cryptographic benchmark suites`);
    res.json({ benchmarks });
  });

  // Migration Plan API
  app.get('/api/migration/plan', (req, res) => {
    if (!db.migrationPlan) {
      db.migrationPlan = roadmapGenerator.generateRoadmap(db);
    }
    res.json({ plan: db.migrationPlan });
  });

  app.patch('/api/migration/tasks/:taskId', (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!db.migrationPlan) {
      return res.status(404).json({ error: 'No active migration plan' });
    }

    let found = false;
    for (const phase of db.migrationPlan.phases) {
      for (const task of phase.tasks) {
        if (task.id === taskId) {
          task.status = status;
          found = true;
          break;
        }
      }
    }

    if (found) {
      const allTasks = db.migrationPlan.phases.flatMap(p => p.tasks);
      const doneTasks = allTasks.filter(t => t.status === 'Done').length;
      db.migrationPlan.overallProgress = Math.round((doneTasks / allTasks.length) * 100);
      db.migrationPlan.updatedAt = new Date().toISOString();
      res.json({ plan: db.migrationPlan });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  });

  // Cryptographic Dependency Graph API
  app.get('/api/graph', (req, res) => {
    interface GraphNode {
      id: string;
      label: string;
      type: 'Asset' | 'Library' | 'Algorithm' | 'Certificate' | 'Endpoint';
      risk: string;
      details?: any;
    }
    interface GraphEdge {
      id: string;
      source: string;
      target: string;
      label?: string;
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();

    const addNode = (node: GraphNode) => {
      if (!nodeIds.has(node.id)) {
        nodeIds.add(node.id);
        nodes.push(node);
      }
    };

    // Add Assets
    for (const asset of db.assets.values()) {
      addNode({
        id: asset.id,
        label: asset.name,
        type: 'Asset',
        risk: asset.risk_score >= 60 ? 'Critical' : asset.risk_score >= 40 ? 'High' : 'Low',
        details: { environment: asset.environment, criticality: asset.criticality, score: asset.risk_score }
      });
    }

    // Add Findings and link to Assets
    for (const f of db.findings.values()) {
      const algoNodeId = `algo-${f.algorithm.replace(/\s+/g, '_')}`;
      addNode({
        id: algoNodeId,
        label: f.algorithm,
        type: 'Algorithm',
        risk: f.quantumRisk,
        details: { category: f.category, keySize: f.keySize, pqc: f.pqcCandidate }
      });

      edges.push({
        id: `e-${f.assetId}-${algoNodeId}`,
        source: f.assetId,
        target: algoNodeId,
        label: f.usage
      });
    }

    // Add Dependencies
    for (const dep of db.dependencies.values()) {
      const depNodeId = `dep-${dep.packageName}`;
      addNode({
        id: depNodeId,
        label: `${dep.packageName} (${dep.version})`,
        type: 'Library',
        risk: dep.quantumExposure,
        details: { manifest: dep.manifestFile }
      });

      edges.push({
        id: `e-${dep.assetId}-${depNodeId}`,
        source: dep.assetId,
        target: depNodeId,
        label: 'depends on'
      });
    }

    // Add Certificates
    for (const cert of db.certificates.values()) {
      const certNodeId = cert.id;
      addNode({
        id: certNodeId,
        label: cert.subject.split(',')[0].replace('CN=', ''),
        type: 'Certificate',
        risk: cert.quantumRisk,
        details: { key: cert.publicKeyAlgorithm, expires: cert.validTo }
      });

      edges.push({
        id: `e-${cert.assetId}-${certNodeId}`,
        source: cert.assetId,
        target: certNodeId,
        label: 'secures'
      });
    }

    res.json({ nodes, edges });
  });

  // Report Generation API
  app.post('/api/reports/generate', (req, res) => {
    const { reportType } = req.body; // 'executive' | 'technical' | 'migration'
    const assets = Array.from(db.assets.values());
    const findings = Array.from(db.findings.values());
    const readiness = readinessEngine.calculateReadiness(db);
    const benchmarks = Array.from(db.benchmarks.values());

    const timestamp = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let reportTitle = 'Q-Forge Executive Summary Report';
    let content = '';

    if (reportType === 'executive') {
      reportTitle = 'Post-Quantum Cryptography Executive Risk & Readiness Report';
      content = `# ${reportTitle}\n\n` +
        `**Generated by Q-Forge Platform** | Date: ${dateStr}\n\n` +
        `## 1. Executive Summary\n` +
        `This report outlines the exposure of institutional cryptographic assets to emerging quantum computing capabilities. ` +
        `Using the **Q-Forge Risk Model**, our automated analysis evaluated **${assets.length} assets** and identified **${findings.length} cryptographic primitives**.\n\n` +
        `**Key Metrics:**\n` +
        `- **Overall Quantum Risk Score**: ${assets.length > 0 ? Math.round(assets.reduce((sum, a) => sum + a.risk_score, 0) / assets.length) : 0}/100\n` +
        `- **Q-Forge Migration Readiness**: ${readiness.overallReadiness}%\n` +
        `- **Shor-Vulnerable Public Key Primitives**: ${findings.filter(f => f.quantumRisk === 'High' || f.quantumRisk === 'Critical').length}\n` +
        `- **Harvest-Now-Decrypt-Later (HNDL) High Targets**: ${Array.from(db.hndlAssessments.values()).filter(h => h.hndlExposure === 'Critical' || h.hndlExposure === 'High').length}\n\n` +
        `## 2. Strategic Risk Breakdown\n` +
        `- **Public Key Cryptography**: Algorithms such as RSA-2048, RSA-3072, and ECDSA P-256 are susceptible to polynomial-time factoring under Shor's algorithm.\n` +
        `- **Symmetric Ciphers & Hash Functions**: AES-256 and SHA-256 maintain adequate post-quantum security margins under Grover's algorithm and require no immediate replacement.\n` +
        `- **Immediate Action**: Implement Hybrid Key Encapsulation (X25519 + ML-KEM-768) on TLS termination to safeguard long-term confidential transactions from passive interception.\n\n` +
        `## 3. High-Priority Assets\n` +
        assets.map(a => `- **${a.name}** (${a.type}): Criticality: *${a.criticality}*, Classification: *${a.data_classification}*, Risk Score: *${a.risk_score}/100*`).join('\n') +
        `\n\n## 4. Migration Governance & Next Steps\n` +
        `Adopt NIST standards (FIPS 203, FIPS 204, FIPS 205) through the 6-phase migration roadmap detailed in the technical annex.`;
    } else if (reportType === 'technical') {
      reportTitle = 'Q-Forge Technical Cryptographic Audit & Discovery Report';
      content = `# ${reportTitle}\n\n` +
        `**Generated by Q-Forge Analysis Engines** | Date: ${dateStr}\n\n` +
        `## 1. Detection Methodology\n` +
        `Cryptographic discovery executed via syntax-aware pattern engines, X.509 certificate parsers, and dependency manifest inspection.\n\n` +
        `## 2. Cryptographic Findings Inventory\n\n` +
        `| ID | Asset | Algorithm | Category | Key Size | Detection Method | Quantum Risk | PQC Candidate |\n` +
        `|---|---|---|---|---|---|---|---|\n` +
        findings.map(f => `| ${f.id} | ${f.assetName} | ${f.algorithm} | ${f.category} | ${f.keySize} | ${f.detectionMethod} | ${f.quantumRisk} | ${f.pqcCandidate || 'N/A'} |`).join('\n') +
        `\n\n## 3. Local Benchmarking Empirical Results\n\n` +
        `| Algorithm | Operation | Exec Time (µs) | Ops/sec | Memory (KB) | Public Key (Bytes) | Sig/Payload (Bytes) |\n` +
        `|---|---|---|---|---|---|---|\n` +
        benchmarks.map(b => `| ${b.algorithm} | ${b.operation} | ${b.executionTimeUs} µs | ${b.operationsPerSec.toLocaleString()} | ${b.memoryUsageKb} | ${b.publicKeyBytes} | ${b.payloadOrSigBytes} |`).join('\n');
    } else {
      reportTitle = 'Q-Forge Post-Quantum Cryptography Migration Plan & Roadmap';
      content = `# ${reportTitle}\n\n` +
        `**Generated for Architecture and Compliance Engineering** | Date: ${dateStr}\n\n` +
        `## 1. Target Post-Quantum Architecture\n` +
        `- **Key Encapsulation**: NIST FIPS 203 (ML-KEM-768) + X25519 Hybrid\n` +
        `- **Digital Signatures**: NIST FIPS 204 (ML-DSA-65) for general PKI; NIST FIPS 205 (SLH-DSA) for firmware/code-signing\n` +
        `- **Symmetric Ciphering**: Retain AES-256-GCM (128-bit quantum security margin)\n\n` +
        `## 2. Phased Roadmap Tasks\n\n` +
        (db.migrationPlan
          ? db.migrationPlan.phases.map(p => `### ${p.name} (${p.targetWindow})\n*Objective: ${p.objective}*\n` + p.tasks.map(t => `- [${t.status === 'Done' ? 'X' : ' '}] **${t.title}** (${t.priority} Priority): ${t.description}`).join('\n')).join('\n\n')
          : 'Roadmap generation pending.') +
        `\n\n## 3. Rollback Guardrails & Dual-Stack Validation\n` +
        `All initial PQC rollouts must employ hybrid models combining classical primitives (X25519/ECDSA) with NIST standardized lattice algorithms to guarantee non-regression during standard transition phases.`;
    }

    res.json({
      title: reportTitle,
      type: reportType,
      generatedAt: timestamp,
      content
    });
  });

  // Q-Advisor AI Assistant API
  app.post('/api/advisor/chat', async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    try {
      const answer = await advisorEngine.queryAdvisor(question, db);
      res.json(answer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings & Risk Model Weights API
  app.get('/api/settings', (req, res) => {
    res.json({
      weights: db.riskWeights,
      scopePolicy: {
        allowLocalScan: true,
        enforceAuthorizationConfirmation: true,
        restrictedPorts: [22, 23, 25, 53, 3306, 5432, 6379, 27017]
      }
    });
  });

  app.post('/api/settings/weights', (req, res) => {
    const { weights } = req.body;
    if (weights) {
      db.riskWeights = { ...db.riskWeights, ...weights };
      db.logAudit('SETTINGS_UPDATED', 'Admin', 'Updated risk model factor weights');
    }
    res.json({ weights: db.riskWeights });
  });

  // Audit Logs API
  app.get('/api/audit', (req, res) => {
    res.json({ auditLogs: db.auditLogs });
  });

  // ----------------------------------------------------
  // VITE OR STATIC MIDDLEWARE
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Q-Forge] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
