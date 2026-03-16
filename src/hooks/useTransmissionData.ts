import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxSubstation, TxFeeder } from "@/types/transmission";

export function useTransmissionData() {
    const { currentTenant, sector, subsector } = useApp();
    const isTransmission = sector === 'power' && subsector === 'Transmission';

    const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
    const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isTransmission || !currentTenant) {
            setTxSubstations([]);
            setTxFeeders([]);
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                const provider = getTransmissionProvider();

                const [substations, feeders] = await Promise.all([
                    provider.listTxSubstations({ org_id: currentTenant.id }),
                    provider.listTxFeeders({ org_id: currentTenant.id })
                ]);

                setTxSubstations(substations);
                setTxFeeders(feeders);
            } catch (err) {
                console.error("Failed to load transmission data:", err);
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isTransmission, currentTenant?.id]);

    return { txSubstations, txFeeders, isTransmission, loading, error };
}
