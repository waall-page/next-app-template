import { getInvitations } from '@/app/actions/invitation';
import InvitationClient from './InvitationClient';

export default async function AdminInvitationsPage() {
    const invitations = await getInvitations();

    return <InvitationClient initialInvitations={invitations} />;
}
