import { getInvitations } from '@/app/actions/invitation';
import { isInvitationEnabled } from '@/lib/env';
import InvitationClient from './InvitationClient';

export default async function AdminInvitationsPage() {
    const invitations = await getInvitations();
    const invitationEnabled = isInvitationEnabled();

    return (
        <InvitationClient
            initialInvitations={invitations}
            isInvitationEnabled={invitationEnabled}
        />
    );
}

