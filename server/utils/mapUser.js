/** Map Supabase user row → frontend shape (camelCase + no password). */

function mapUser(user) {
    if (!user) return null;
    const {
        id,
        password,
        verification_status,
        verification_document,
        ...rest
    } = user;
    return {
        _id: id,
        ...rest,
        ...(verification_status !== undefined && { verificationStatus: verification_status }),
        ...(verification_document !== undefined && { verificationDocument: verification_document }),
    };
}

module.exports = { mapUser };
