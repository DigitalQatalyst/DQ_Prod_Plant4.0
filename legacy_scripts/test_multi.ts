import { TransmissionProvider } from './src/lib/data/providers/TransmissionProvider';
async function test() {
    const p = new TransmissionProvider();
    const res = await p.getMultiFluidSummary({ org_id: '69083830-a193-4f8b-aab2-0d17349d286c' });
    console.log('Response length:', res?.length);
    const res2 = await p.getMultiFluidSummary({ org_id: 't-dewa' });
    console.log('Response length with t-dewa:', res2?.length);
}
test().catch(console.error);
