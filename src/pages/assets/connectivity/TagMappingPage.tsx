/**
 * Tag Mapping Page
 * Route: /assets/connectivity/tags
 * 
 * Lists tags linked to assets with filtering and search.
 * Supports bulk tag mapping interface.
 * 
 * Requirements: 4.5, 4.6
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Tag } from 'lucide-react';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';

const PROTOCOLS = ['IEC61850', 'DNP3', 'OPC-UA', 'Modbus-TCP', 'MQTT'] as const;

interface TagMapping {
  id: string;
  assetId: string;
  assetName: string;
  protocol: string;
  address: string;
  name: string;
}

export default function TagMappingPage() {
  const [tags, setTags] = useState<TagMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');

  // Mock data for demonstration
  useEffect(() => {
    const loadTags = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockTags: TagMapping[] = [
          {
            id: '1',
            assetId: 'asset-1',
            assetName: 'Transformer T1',
            protocol: 'IEC61850',
            address: 'IED1$LD0$MMXU1$TotW',
            name: 'Active Power',
          },
          {
            id: '2',
            assetId: 'asset-1',
            assetName: 'Transformer T1',
            protocol: 'IEC61850',
            address: 'IED1$LD0$MMXU1$TotVAr',
            name: 'Reactive Power',
          },
          {
            id: '3',
            assetId: 'asset-2',
            assetName: 'Circuit Breaker CB1',
            protocol: 'DNP3',
            address: '10:0',
            name: 'Breaker Status',
          },
          {
            id: '4',
            assetId: 'asset-2',
            assetName: 'Circuit Breaker CB1',
            protocol: 'DNP3',
            address: '30:1',
            name: 'Trip Coil Current',
          },
          {
            id: '5',
            assetId: 'asset-3',
            assetName: 'Voltage Regulator VR1',
            protocol: 'Modbus-TCP',
            address: '40001',
            name: 'Tap Position',
          },
          {
            id: '6',
            assetId: 'asset-3',
            assetName: 'Voltage Regulator VR1',
            protocol: 'Modbus-TCP',
            address: '40002',
            name: 'Load Current',
          },
        ];

        setTags(mockTags);
        if (mockTags.length > 0 && !selectedTagId) {
          setSelectedTagId(mockTags[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tags');
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  // Filter tags
  const filteredTags = useMemo(() => {
    let filtered = tags;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tag) =>
          tag.address.toLowerCase().includes(query) ||
          tag.name.toLowerCase().includes(query) ||
          tag.assetName.toLowerCase().includes(query)
      );
    }

    if (protocolFilter !== 'all') {
      filtered = filtered.filter((tag) => tag.protocol === protocolFilter);
    }

    if (assetFilter !== 'all') {
      filtered = filtered.filter((tag) => tag.assetName === assetFilter);
    }

    return filtered;
  }, [tags, searchQuery, protocolFilter, assetFilter]);

  // Set initial selected tag
  useMemo(() => {
    if (filteredTags.length > 0 && !selectedTagId) {
      setSelectedTagId(filteredTags[0].id);
    }
  }, [filteredTags, selectedTagId]);

  const selectedTag = tags.find((t) => t.id === selectedTagId);

  // Get unique asset names for filter
  const uniqueAssets = Array.from(new Set(tags.map((t) => t.assetName))).sort();

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading tag mappings..." />;
  }

  if (error) {
    return (
      <>
        <ListPane title="Tag Mapping" subtitle="Error loading data" count={0}>
          <EmptyState title="Error" description={error} />
        </ListPane>
        <WorkPane title="Tag Mapping" subtitle="Error loading data" tabs={[]} />
      </>
    );
  }

  const tabs = selectedTag
    ? [
      {
        id: 'details',
        label: 'Tag Details',
        content: <TagDetails tag={selectedTag} />,
      },
      {
        id: 'bulk',
        label: 'Bulk Mapping',
        content: <BulkMappingInfo />,
      },
    ]
    : [];

  return (
    <>
      <ListPane
        title="Tag Mapping"
        subtitle={`${filteredTags.length} total tag mappings`}
        count={filteredTags.length}
        searchPlaceholder="Search tags..."
        onSearch={setSearchQuery}
        showExpandableFilters={true}
        filters={[
          {
            key: 'asset',
            label: 'Asset',
            value: assetFilter,
            onChange: setAssetFilter,
            options: [
              { value: 'all', label: 'All Assets' },
              ...uniqueAssets.map((asset) => ({ value: asset, label: asset })),
            ],
          },
          {
            key: 'protocol',
            label: 'Protocol',
            value: protocolFilter,
            onChange: setProtocolFilter,
            options: [
              { value: 'all', label: 'All Protocols' },
              ...PROTOCOLS.map((p) => ({ value: p, label: p })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Bulk Mapping
          </Button>
        }
      >
        {filteredTags.length === 0 ? (
          <EmptyState
            title="No tag mappings found"
            description={
              searchQuery || protocolFilter !== 'all' || assetFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create tag mappings to link assets with protocol addresses'
            }
          />
        ) : (
          filteredTags.map((tag) => (
            <div
              key={tag.id}
              onClick={() => setSelectedTagId(tag.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTagId === tag.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30 bg-card'
                }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate min-w-0 flex-1">{tag.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      {tag.protocol}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {tag.assetName}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">
                    {tag.address}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </ListPane>

      {selectedTag && (
        <WorkPane
          title={selectedTag.name}
          subtitle={`${selectedTag.protocol} tag mapping`}
          tabs={tabs}
        />
      )}
    </>
  );
}

function TagDetails({ tag }: { tag: TagMapping }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tag Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tag Name</p>
              <p className="text-sm">{tag.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Protocol</p>
              <Badge variant="outline">{tag.protocol}</Badge>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Protocol Address</p>
              <p className="text-sm font-mono bg-muted p-2 rounded">{tag.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Asset Name</p>
              <p className="text-sm">{tag.assetName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Asset ID</p>
              <p className="text-sm font-mono">{tag.assetId}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BulkMappingInfo() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Tag Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Bulk tag mapping allows you to create multiple tag mappings at once by:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Selecting multiple assets</li>
            <li>Defining a protocol and address pattern</li>
            <li>Previewing the generated mappings</li>
            <li>Confirming creation of all mappings</li>
          </ul>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Start Bulk Mapping
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protocol Address Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Badge variant="outline" className="mb-1">IEC61850</Badge>
              <p className="text-xs text-muted-foreground font-mono">
                IED1$LD0$MMXU1$TotW
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">DNP3</Badge>
              <p className="text-xs text-muted-foreground font-mono">
                10:0 (object:index)
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Modbus-TCP</Badge>
              <p className="text-xs text-muted-foreground font-mono">
                40001 (register address)
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">OPC-UA</Badge>
              <p className="text-xs text-muted-foreground font-mono">
                ns=2;s=Device.Sensor.Value
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
