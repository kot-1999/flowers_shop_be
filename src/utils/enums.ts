export enum PassportStrategy {
    google = 'google',
    jwtUserForgotPassword = 'jwt-user-forgot_password',
    jwtAdminForgotPassword = 'jwt-admin-forgot_password',
}

export enum EmailType {
    forgotPassword = 'forgotPassword',
    registered = 'registered'
}

export enum JwtAudience {
    userForgotPassword = 'userfps',
    adminForgotPassword = 'adminfps'
}

export enum NodeEnv {
    Dev = 'dev',
    Prod = 'prod',
    Test = 'test',
}

export enum Language {
    en = 'en',
    ua = 'ua',
    sk = 'sk',
    de = 'de'
}