export enum PassportStrategy {
    google = 'google',
    jwtUser = 'jwt-usr',
    jwtUserForgotPassword = 'jwt-user-forgot_password',
    jwtAdmin = 'jwt-b2b',
    jwtAdminForgotPassword = 'jwt-admin-forgot_password',
}

export enum EmailType {
    forgotPassword = 'forgotPassword',
    registered = 'registered'
}

export enum JwtAudience {
    user ='user',
    admin = 'admin',
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