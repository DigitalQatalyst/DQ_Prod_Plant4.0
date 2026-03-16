/**
 * TEST PAGE: Direct Query Test for Efficiency KPIs
 * 
 * This page bypasses AppContext and queries Supabase directly
 * to verify the data flow works end-to-end.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAnalyticsProvider } from "@/lib/data/providers/AnalyticsProvider";
import { Activity, CheckCircle, XCircle } from "lucide-react";

export function TestEfficiencyKPIsDirectQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scopes, setScopes] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectQuery = async () => {
    setLoading(true);
    setError(null);
    setScopes([]);
    setLogs([]);

    try {
      addLog('🔍 Starting direct query test...');
      
      // Step 1: Get Supabase client
      addLog('Step 1: Importing Supabase client...');
      const { supabase } = await import('@/lib/supabase');
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      addLog('✅ Supabase client ready');

      // Step 2: Query for transmission tenant
      addLog('Step 2: Querying for transmission tenant...');
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('sector', 'power')
        .eq('subsector', 'transmission')
        .limit(1);
      
      if (tenantError) {
        throw new Error(`Tenant query failed: ${tenantError.message}`);
      }
      
      if (!tenants || tenants.length === 0) {
        throw new Error('No transmission tenant found in Supabase');
      }
      
      const tenant = tenants[0];
      addLog(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

      // Step 3: Query KPI snapshots using AnalyticsProvider
      addLog('Step 3: Querying efficiency scopes via AnalyticsProvider...');
      const analyticsProvider = getAnalyticsProvider();
      const efficiencyScopes = await analyticsProvider.getTransmissionEfficiencyScopes(tenant.id);
      
      addLog(`✅ Received ${efficiencyScopes.length} efficiency scopes`);
      setScopes(efficiencyScopes);
      
      // Step 4: Log details
      if (efficiencyScopes.length > 0) {
        addLog('📊 Sample scope data:');
        const sample = efficiencyScopes[0];
        addLog(`   - Name: ${sample.name}`);
        addLog(`   - Category: ${sample.category}`);
        addLog(`   - Status: ${sample.status}`);
        if (sample.lossesPct) addLog(`   - Losses: ${sample.lossesPct}%`);
        if (sample.loadFactor) addLog(`   - Load Factor: ${sample.loadFactor}`);
      }
      
      addLog('✅ Test completed successfully!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`❌ Test failed: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Direct Query Test - Efficiency KPIs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This test page queries Supabase directly to verify the data flow works end-to-end.
          </p>
          
          <Button 
            onClick={testDirectQuery} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Running Test...
              </>
            ) : (
              'Run Direct Query Test'
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Test Failed</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && scopes.length > 0 && (
            <div className="flex items-start gap-2 p-4 bg-green-500/10 border border-green-500 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold text-green-500">Test Passed</p>
                <p className="text-sm text-green-500/80">
                  Successfully loaded {scopes.length} efficiency scopes from Supabase
                </p>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 font-mono text-xs max-h-96 overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i} className="text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {scopes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Efficiency Scopes ({scopes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scopes.map((scope, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="font-semibold">{scope.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Category: {scope.category} | Status: {scope.status}
                      </div>
                      {scope.lossesPct && (
                        <div className="text-xs">Losses: {scope.lossesPct}%</div>
                      )}
                      {scope.loadFactor && (
                        <div className="text-xs">Load Factor: {scope.loadFactor}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}