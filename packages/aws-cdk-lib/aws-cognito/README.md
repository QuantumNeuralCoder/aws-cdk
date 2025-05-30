# Amazon Cognito Construct Library


[Amazon Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html) provides
authentication, authorization, and user management for your web and mobile apps. Your users can sign in directly with a
user name and password, or through a third party such as Facebook, Amazon, Google or Apple.

The two main components of Amazon Cognito are [user
pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html) and [identity
pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html). User pools are user directories
that provide sign-up and sign-in options for your app users. Identity pools enable you to grant your users access to
other AWS services. Identity Pool L2 Constructs can be found [here](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cognito-identitypool-alpha-readme.html).

This module is part of the [AWS Cloud Development Kit](https://github.com/aws/aws-cdk) project.

## Table of Contents

- [Amazon Cognito Construct Library](#amazon-cognito-construct-library)
  - [Table of Contents](#table-of-contents)
  - [User Pools](#user-pools)
    - [User pool feature plans](#user-pool-feature-plans)
    - [Sign Up](#sign-up)
      - [Code Verification](#code-verification)
      - [Link Verification](#link-verification)
    - [Sign In](#sign-in)
      - [Choice-based authentication](#choice-based-authentication-passwordless-sign-in--passkey-sign-in)
    - [Attributes](#attributes)
    - [Attribute verification](#attribute-verification)
    - [Security](#security)
      - [Multi-factor Authentication (MFA)](#multi-factor-authentication-mfa)
      - [Account Recovery Settings](#account-recovery-settings)
      - [Advanced Security Mode](#advanced-security-mode)
      - [Threat Protection](#threat-protection)
    - [Emails](#emails)
    - [Device Tracking](#device-tracking)
    - [Lambda Triggers](#lambda-triggers)
      - [Trigger Permissions](#trigger-permissions)
    - [Importing User Pools](#importing-user-pools)
    - [Identity Providers](#identity-providers)
    - [App Clients](#app-clients)
    - [Resource Servers](#resource-servers)
    - [Domains](#domains)
    - [Deletion protection](#deletion-protection)
    - [Analytics Configuration](#analytics-configuration)
      - [When specifying a Pinpoint application from the same account](#when-specifying-a-pinpoint-application-from-the-same-account)
      - [When specifying a Pinpoint application from a different account](#when-specifying-a-pinpoint-application-from-a-different-account)

## User Pools

User pools allow creating and managing your own directory of users that can sign up and sign in. They enable easy
integration with social identity providers such as Facebook, Google, Amazon, Microsoft Active Directory, etc. through
SAML.

Using the CDK, a new user pool can be created as part of the stack using the construct's constructor. You may specify
the `userPoolName` to give your own identifier to the user pool. If not, CloudFormation will generate a name.

```ts
new cognito.UserPool(this, 'myuserpool', {
  userPoolName: 'myawesomeapp-userpool',
  signInCaseSensitive: false, // case insensitive is preferred in most situations
});
```

By default, usernames and email addresses in user pools are case sensitive, which means `user@example.com` and `User@example.com`
are considered different. In most situations it is preferred to have usernames and email addresses be case insensitive so that
capitalization differences are ignored. As shown above, you can make a user pool case insensitive by setting `signInCaseSensitive`
to `false`. The case sensitivity cannot be changed once a user pool is created.

The default set up for the user pool is configured such that only administrators will be allowed
to create users. Features such as Multi-factor authentication (MFAs) and Lambda Triggers are not
configured by default.

Use the `grant()` method to add an IAM policy statement associated with the user pool to an
IAM principal's policy.

```ts
const userPool = new cognito.UserPool(this, 'myuserpool');
const role = new iam.Role(this, 'role', {
  assumedBy: new iam.ServicePrincipal('foo'),
});
userPool.grant(role, 'cognito-idp:AdminCreateUser');
```

### User pool feature plans

Amazon Cognito has feature plans for user pools. Each plan has a set of features and a monthly cost per active user. Each feature plan unlocks access to more features than the one before it.
Learn more about [feature plans here](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-sign-in-feature-plans.html).

- *Lite* - a low-cost feature plan for user pools with lower numbers of monthly active users.
- *Essentials* - all of the latest user pool authentication features.
- *Plus* - includes everything in the Essentials plan and adds advanced security features that protect your users.

The default feature plan is Essentials for newly create user pools.
For the existing user pools, Lite plan is automatically set.

Previously, some user pool features were included in [an advanced security features](#advanced-security-mode) pricing structure. The features that were included in this structure are now under either the Essentials or Plus plan.

### Sign Up

Users can either be signed up by the app's administrators or can sign themselves up. Once a user has signed up, their
account needs to be confirmed. Cognito provides several ways to sign users up and confirm their accounts. Learn more
about [user sign up here](https://docs.aws.amazon.com/cognito/latest/developerguide/signing-up-users-in-your-app.html).

To verify the email address of a user in your user pool with Amazon Cognito, you can send the user an email message
with a link that they can select, or you can send them a code that they can enter.

#### Code Verification

When a user signs up, email and SMS messages are used to verify their account and contact methods. The following code
snippet configures a user pool with properties relevant to these verification messages -

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  selfSignUpEnabled: true,
  userVerification: {
    emailSubject: 'Verify your email for our awesome app!',
    emailBody: 'Thanks for signing up to our awesome app! Your verification code is {####}',
    emailStyle: cognito.VerificationEmailStyle.CODE,
    smsMessage: 'Thanks for signing up to our awesome app! Your verification code is {####}',
  },
});
```

By default, self sign up is disabled. Learn more about [email and SMS verification messages
here](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-message-customizations.html).

Besides users signing themselves up, an administrator of any user pool can sign users up. The user then receives an
invitation to join the user pool. The following code snippet configures a user pool with properties relevant to the
invitation messages -

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  userInvitation: {
    emailSubject: 'Invite to join our awesome app!',
    emailBody: 'Hello {username}, you have been invited to join our awesome app! Your temporary password is {####}',
    smsMessage: 'Hello {username}, your temporary password for our awesome app is {####}',
  },
});
```

#### Link Verification
Alternatively, users can use link as a verification method. The following code snippet configures a user pool with
properties relevant to these verification messages and link verification method.

```ts
new cognito.UserPool(this, 'myuserpool', {
  userVerification: {
    emailStyle: cognito.VerificationEmailStyle.LINK,
    emailSubject: 'Invite to join our awesome app!',
    emailBody: 'You have been invited to join our awesome app! {##Verify Your Email##}',
  },
});
```

All email subjects, bodies and SMS messages for both invitation and verification support Cognito's message templating.
Learn more about [message templates
here](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-message-templates.html).

### Sign In

Users registering or signing in into your application can do so with multiple identifiers. There are 4 options
available:

- `username`: Allow signing in using the one time immutable user name that the user chose at the time of sign up.
- `email`: Allow signing in using the email address that is associated with the account.
- `phone`: Allow signing in using the phone number that is associated with the account.
- `preferredUsername`: Allow signing in with an alternate user name that the user can change at any time. However, this
  is not available if the `username` option is not chosen.

The following code sets up a user pool so that the user can sign in with either their username or their email address -

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  // ...
  signInAliases: {
    username: true,
    email: true,
  },
});
```

User pools can either be configured so that user name is primary sign in form, but also allows for the other three to be
used additionally; or it can be configured so that email and/or phone numbers are the only ways a user can register and
sign in. Read more about this
[here](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html#user-pool-settings-aliases-settings).

⚠️ The Cognito service prevents changing the `signInAlias` property for an existing user pool.

To match with 'Option 1' in the above link, with a verified email, `signInAliases` should be set to
`{ username: true, email: true }`. To match with 'Option 2' in the above link with both a verified
email and phone number, this property should be set to `{ email: true, phone: true }`.

Cognito recommends that email and phone number be automatically verified, if they are one of the sign in methods for
the user pool. Read more about that
[here](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html#user-pool-settings-aliases).
The CDK does this by default, when email and/or phone number are specified as part of `signInAliases`. This can be
overridden by specifying the `autoVerify` property.

The following code snippet sets up only email as a sign in alias, but both email and phone number to be auto-verified.

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  // ...
  signInAliases: { username: true, email: true },
  autoVerify: { email: true, phone: true },
});
```

A user pool can optionally ignore case when evaluating sign-ins. When `signInCaseSensitive` is false, Cognito will not
check the capitalization of the alias when signing in. Default is true.

#### Choice-based authentication: passwordless sign-in / passkey sign-in

User pools can be configured to allow the following authentication methods in choice-based authentication:
- Passwordless sign-in with email message one-time password
- Passwordless sign-in with SMS message one-time password
- Passkey (WebAuthn) sign-in

To use choice-based authentication, [User pool feature plan](#user-pool-feature-plans) should be Essentials or higher.

For details of authentication methods and client implementation, see [Manage authentication methods in AWS SDKs](https://docs.aws.amazon.com/cognito/latest/developerguide/authentication-flows-selection-sdk.html).

The following code configures a user pool with choice-based authentication enabled:

```ts
const userPool = new cognito.UserPool(this, 'myuserpool', {
  signInPolicy: {
    allowedFirstAuthFactors: {
      password: true, // password authentication must be enabled
      emailOtp: true, // enables email message one-time password
      smsOtp: true,   // enables SMS message one-time password
      passkey: true,  // enables passkey sign-in
    },
  },
});

// You should also configure the user pool client with USER_AUTH authentication flow allowed
userPool.addClient('myclient', {
  authFlows: { user: true },
});
```

⚠️ Enabling SMS message one-time password requires the AWS account be activated to SMS message sending.
Learn more about [SMS message settings for Amazon Cognito user pools](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-sms-settings.html).

When enabling passkey sign-in, you should specify the authentication domain used as the relying party ID.
Learn more about [passkey sign-in of user pools](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html#amazon-cognito-user-pools-authentication-flow-methods-passkey) and [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API).

```ts
// Use the hosted Amazon Cognito domain as the relying party ID
new cognito.UserPool(this, 'myuserpool', {
  signInPolicy: {
    allowedFirstAuthFactors: { password: true, passkey: true },
  },
  passkeyRelyingPartyId: 'myclientname.auth.region-name.amazoncognito.com',
});

// Use the custom domain as the relying party ID
new cognito.UserPool(this, 'myuserpool', {
  signInPolicy: {
    allowedFirstAuthFactors: { password: true, passkey: true },
  },
  passkeyRelyingPartyId: 'auth.example.com',
});
```

You can configure user verification to be preferred (default) or required. When you set user verification to preferred, users can set up authenticators that don't have the user verification capability, and registration and authentication operations can succeed without user verification. To mandate user verification in passkey registration and authentication, specify `passkeyUserVerification` to `PasskeyUserVerification.REQUIRED`.

```ts
new cognito.UserPool(this, 'myuserpool', {
  signInPolicy: {
    allowedFirstAuthFactors: { password: true, passkey: true },
  },
  passkeyRelyingPartyId: 'auth.example.com',
  passkeyUserVerification: cognito.PasskeyUserVerification.REQUIRED,
});
```

To disable choice-based authentication explicitly, specify `password` only.

```ts
new cognito.UserPool(this, 'myuserpool', {
  signInPolicy: {
    allowedFirstAuthFactors: { password: true },
  },
  featurePlan: cognito.FeaturePlan.LITE,
});
```

### Attributes

Attributes represent the various properties of each user that's collected and stored in the user pool. Cognito
provides a set of standard attributes that are available for all user pools. Users are allowed to select any of these
standard attributes to be required. Users will not be able to sign up to the user pool without providing the required
attributes. Besides these, additional attributes can be further defined, and are known as custom attributes.

Learn more on [attributes in Cognito's
documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html).

The following code configures a user pool with two standard attributes (name and address) as required and mutable, and adds
four custom attributes.

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  standardAttributes: {
    fullname: {
      required: true,
      mutable: false,
    },
    address: {
      required: false,
      mutable: true,
    },
  },
  customAttributes: {
    'myappid': new cognito.StringAttribute({ minLen: 5, maxLen: 15, mutable: false }),
    'callingcode': new cognito.NumberAttribute({ min: 1, max: 3, mutable: true }),
    'isEmployee': new cognito.BooleanAttribute({ mutable: true }),
    'joinedOn': new cognito.DateTimeAttribute(),
  },
});
```

As shown in the code snippet, there are data types that are available for custom attributes. The 'String' and 'Number'
data types allow for further constraints on their length and values, respectively.

Custom attributes cannot be marked as required.

All custom attributes share the property `mutable` that specifies whether the value of the attribute can be changed.
The default value is `false`.

User pools come with two 'built-in' attributes - `email_verified` and `phone_number_verified`. These cannot be
configured (required-ness or mutability) as part of user pool creation. However, user pool administrators can modify
them for specific users using the [AdminUpdateUserAttributes API].

[AdminUpdateUserAttributes API]: https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminUpdateUserAttributes.html

### Attribute verification

When your user updates an email address or phone number attribute, Amazon Cognito marks it unverified until they verify the new value.
You can’t send messages to an unverified email address or phone number.
Your user can’t sign in with an unverified alias attribute.
You can choose how Amazon Cognito handles an updated email address or phone number after the update and before the verification.

Learn more on [configuring email or phone verification in Cognito's documentation.](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-email-phone-verification.html?icmpid=docs_cognito_console_help_panel)

The following code configures a user pool that keeps the original value for the two standard attributes (email and phone_number) until the new values are verified.

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  signInAliases: { username: true },
  autoVerify: { email: true, phone: true },
  keepOriginal: {
    email: true,
    phone: true,
  },
});
```


### Security

Cognito sends various messages to its users via SMS, for different actions, ranging from account verification to
marketing. In order to send SMS messages, Cognito needs an IAM role that it can assume, with permissions that allow it
to send SMS messages.

By default, the CDK looks at all of the specified properties (and their defaults when not explicitly specified) and
automatically creates an SMS role, when needed. For example, if MFA second factor by SMS is enabled, the CDK will
create a new role. The `smsRole` property can be used to specify the user supplied role that should be used instead.
Additionally, the property `enableSmsRole` can be used to override the CDK's default behaviour to either enable or
suppress automatic role creation.

```ts
const poolSmsRole = new iam.Role(this, 'userpoolsmsrole', {
  assumedBy: new iam.ServicePrincipal('foo'),
});

new cognito.UserPool(this, 'myuserpool', {
  // ...
  smsRole: poolSmsRole,
  smsRoleExternalId: 'c87467be-4f34-11ea-b77f-2e728ce88125',
});
```

When the `smsRole` property is specified, the `smsRoleExternalId` may also be specified. The value of
`smsRoleExternalId` will be used as the `sts:ExternalId` when the Cognito service assumes the role. In turn, the role's
assume role policy should be configured to accept this value as the ExternalId. Learn more about [ExternalId
here](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user_externalid.html).

#### Multi-factor Authentication (MFA)

User pools can be configured to enable multi-factor authentication (MFA). It can either be turned off, set to optional
or made required. Setting MFA to optional means that individual users can choose to enable it.
Additionally, the MFA code can be sent either via SMS text message or via a time-based software token.
See the [documentation on MFA](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html) to
learn more.

The following code snippet marks MFA for the user pool as required. This means that all users are required to
configure an MFA token and use it for sign in. It also allows for the users to use both SMS based MFA, as well,
[time-based one time password
(TOTP)](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa-totp.html).

If you want to enable email-based MFA, set `email` property to the Amazon SES email-sending configuration and set `featurePlan` to `FeaturePlan.ESSENTIALS` or `FeaturePlan.PLUS`.
For more information, see [SMS and email message MFA](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa-sms-email-message.html).

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  mfa: cognito.Mfa.REQUIRED,
  mfaSecondFactor: {
    sms: true,
    otp: true,
    email: false, // email-based MFA
  },
});
```

User pools can be configured with policies around a user's password. This includes the password length and the
character sets that they must contain.

Further to this, it can also be configured with the validity of the auto-generated temporary password. A temporary
password is generated by the user pool either when an admin signs up a user or when a password reset is requested.
The validity of this password dictates how long to give the user to use this password before expiring it.

You can also set a policy for password reuse by setting the `passwordHistorySize` property.
You can prevent a user from resetting their password to a new password that matches their current password or any of up to 23 additional previous passwords, for a maximum total of 24.
The `passwordHistorySize` property can not be set when `featurePlan` is `FeaturePlan.LITE`.

The following code snippet configures these properties -

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  passwordPolicy: {
    minLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: true,
    tempPasswordValidity: Duration.days(3),
  },
});
```

Note that, `tempPasswordValidity` can be specified only in whole days. Specifying fractional days would throw an error.

#### Account Recovery Settings

User pools can be configured on which method a user should use when recovering the password for their account. This
can either be email and/or SMS. Read more at [Recovering User Accounts](https://docs.aws.amazon.com/cognito/latest/developerguide/how-to-recover-a-user-account.html)

```ts
new cognito.UserPool(this, 'UserPool', {
  // ...
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
})
```

The default for account recovery is by phone if available and by email otherwise.
A user will not be allowed to reset their password via phone if they are also using it for MFA.

#### Advanced Security Mode

⚠️ Advanced Security Mode is deprecated in favor of [Threat Protection](#threat-protection).

User pools can be configured to use Advanced security. You can turn the user pool advanced security features on, and customize the actions that are taken in response to different risks. Or you can use audit mode to gather metrics on detected risks without taking action. In audit mode, the advanced security features publish metrics to Amazon CloudWatch. See the [documentation on Advanced security](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-advanced-security.html) to learn more.

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
});
```

### Threat Protection

This feature is only available if your Feature Plan is set to PLUS. 

Threat Protection can be set to configure enforcement levels and automatic responses for users in password-based and custom-challenge authentication flows.
For configuration, there are 2 options for standard authentication and custom authentication.
These are represented with properties `standardThreatProtectionMode` and `customThreatProtectionMode`.
See the [documentation on Threat Protection](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-threat-protection.html)


### Emails

Cognito sends emails to users in the user pool, when particular actions take place, such as welcome emails, invitation
emails, password resets, etc. The address from which these emails are sent can be configured on the user pool.
Read more at [Email settings for User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html).

By default, user pools are configured to use Cognito's built in email capability, which will send emails
from `no-reply@verificationemail.com`. If you want to use a custom email address you can configure
Cognito to send emails through Amazon SES, which is detailed below.

```ts
new cognito.UserPool(this, 'myuserpool', {
  email: cognito.UserPoolEmail.withCognito('support@myawesomeapp.com'),
});
```

For typical production environments, the default email limit is below the required delivery volume.
To enable a higher delivery volume, you can configure the UserPool to send emails through Amazon SES. To do
so, follow the steps in the [Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html#user-pool-email-developer)
to verify an email address, move the account out of the SES sandbox, and grant Cognito email permissions via an
authorization policy.

Once the SES setup is complete, the UserPool can be configured to use the SES email.

```ts
new cognito.UserPool(this, 'myuserpool', {
  email: cognito.UserPoolEmail.withSES({
    fromEmail: 'noreply@myawesomeapp.com',
    fromName: 'Awesome App',
    replyTo: 'support@myawesomeapp.com',
  }),
});
```

Sending emails through SES requires that SES be configured (as described above) in a valid SES region.
If the UserPool is being created in a different region, `sesRegion` must be used to specify the correct SES region.

```ts
new cognito.UserPool(this, 'myuserpool', {
  email: cognito.UserPoolEmail.withSES({
    sesRegion: 'us-east-1',
    fromEmail: 'noreply@myawesomeapp.com',
    fromName: 'Awesome App',
    replyTo: 'support@myawesomeapp.com',
  }),
});

```

When sending emails from an SES verified domain, `sesVerifiedDomain` can be used to specify the domain.
The email address does not need to be verified when sending emails from a verified domain, because the identity of the email configuration is can be determined from the domain alone.

```ts
new cognito.UserPool(this, 'myuserpool', {
  email: cognito.UserPoolEmail.withSES({
    sesRegion: 'us-east-1',
    fromEmail: 'noreply@myawesomeapp.com',
    fromName: 'Awesome App',
    replyTo: 'support@myawesomeapp.com',
    sesVerifiedDomain: 'myawesomeapp.com',
  }),
});
```

If `fromName` does not comply RFC 5322 atom or quoted-string, it will be quoted or mime-encoded.

```ts
new cognito.UserPool(this, 'myuserpool', {
  email: cognito.UserPoolEmail.withSES({
    fromEmail: 'noreply@myawesomeapp.com',
    fromName: 'myname@mycompany.com',
  }),
});
// => From: "myname@mycompany.com" <noreply@myawesomeapp.com>
```

### Device Tracking

User pools can be configured to track devices that users have logged in to.
Read more at [Device Tracking](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-device-tracking.html)

```ts
new cognito.UserPool(this, 'myuserpool', {
  // ...
  deviceTracking: {
    challengeRequiredOnNewDevice: true,
    deviceOnlyRememberedOnUserPrompt: true,
  },
});
```

The default is to not track devices.

### Lambda Triggers

User pools can be configured such that AWS Lambda functions can be triggered when certain user operations or actions
occur, such as, sign up, user confirmation, sign in, etc. They can also be used to add custom authentication
challenges, user migrations and custom verification messages. Learn more about triggers at [User Pool Workflows with
Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html).

Lambda triggers can either be specified as part of the `UserPool` initialization, or it can be added later, via methods
on the construct, as so -

```ts
const authChallengeFn = new lambda.Function(this, 'authChallengeFn', {
  runtime: lambda.Runtime.NODEJS_LATEST,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'path/to/asset')),
});

const userpool = new cognito.UserPool(this, 'myuserpool', {
  // ...
  lambdaTriggers: {
    createAuthChallenge: authChallengeFn,
    // ...
  },
});

userpool.addTrigger(cognito.UserPoolOperation.USER_MIGRATION, new lambda.Function(this, 'userMigrationFn', {
    runtime: lambda.Runtime.NODEJS_LATEST,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'path/to/asset')),
}));
```

Additionally, only the pre token generation Lambda trigger supports trigger events with lambda version V2.0 or V3.0.
For details, see [Pre Token Generation Lambda Trigger](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html).

```ts
declare const userpool: cognito.UserPool;
declare const preTokenGenerationFn: lambda.Function;

userpool.addTrigger(cognito.UserPoolOperation.PRE_TOKEN_GENERATION_CONFIG, preTokenGenerationFn, cognito.LambdaVersion.V2_0);
```

The following table lists the set of triggers available, and their corresponding method to add it to the user pool.
For more information on the function of these triggers and how to configure them, read [User Pool Workflows with
Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html).

#### Trigger Permissions

The `function.attachToRolePolicy()` API can be used to add additional IAM permissions to the lambda trigger
as necessary.

⚠️ Using the `attachToRolePolicy` API to provide permissions to your user pool will result in a circular dependency. See [aws/aws-cdk#7016](https://github.com/aws/aws-cdk/issues/7016).
Error message when running `cdk synth` or `cdk deploy`:
> Circular dependency between resources: [pool056F3F7E, fnPostAuthFnCognitoA630A2B1, ...]

To work around the circular dependency issue, use the `attachInlinePolicy()` API instead, as shown below.

```ts
declare const postAuthFn: lambda.Function;

const userpool = new cognito.UserPool(this, 'myuserpool', {
  lambdaTriggers: {
    postAuthentication: postAuthFn,
  },
});

// provide permissions to describe the user pool scoped to the ARN the user pool
postAuthFn.role?.attachInlinePolicy(new iam.Policy(this, 'userpool-policy', {
  statements: [new iam.PolicyStatement({
    actions: ['cognito-idp:DescribeUserPool'],
    resources: [userpool.userPoolArn],
  })],
}));
```

### Importing User Pools

Any user pool that has been created outside of this stack, can be imported into the CDK app. Importing a user pool
allows for it to be used in other parts of the CDK app that reference an `IUserPool`. However, imported user pools have
limited configurability. As a rule of thumb, none of the properties that are part of the
[`AWS::Cognito::UserPool`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpool.html)
CloudFormation resource can be configured.

User pools can be imported either using their id via the `UserPool.fromUserPoolId()`, or by using their ARN, via the
`UserPool.fromUserPoolArn()` API.

```ts
const awesomePool = cognito.UserPool.fromUserPoolId(this, 'awesome-user-pool', 'us-east-1_oiuR12Abd');

const otherAwesomePool = cognito.UserPool.fromUserPoolArn(this, 'other-awesome-user-pool',
  'arn:aws:cognito-idp:eu-west-1:123456789012:userpool/us-east-1_mtRyYQ14D');
```

### Identity Providers

Users that are part of a user pool can sign in either directly through a user pool, or federate through a third-party
identity provider. Once configured, the Cognito backend will take care of integrating with the third-party provider.
Read more about [Adding User Pool Sign-in Through a Third
Party](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-identity-federation.html).

The following third-party identity providers are currently supported in the CDK -

- [Login With Amazon](https://developer.amazon.com/apps-and-games/login-with-amazon)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login/)
- [Google Login](https://developers.google.com/identity/sign-in/web/sign-in)
- [Sign In With Apple](https://developer.apple.com/sign-in-with-apple/get-started/)
- [OpenID Connect](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-oidc-idp.html)
- [SAML](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-saml-idp.html)

The following code configures a user pool to federate with the third party provider, 'Login with Amazon'. The identity
provider needs to be configured with a set of credentials that the Cognito backend can use to federate with the
third-party identity provider.

```ts
const userpool = new cognito.UserPool(this, 'Pool');

const provider = new cognito.UserPoolIdentityProviderAmazon(this, 'Amazon', {
  clientId: 'amzn-client-id',
  clientSecret: 'amzn-client-secret',
  userPool: userpool,
});
```

Using Google identity provider is possible to use clientSecretValue with SecretValue from secrets manager.

```ts
const userpool = new cognito.UserPool(this, 'Pool');
const secret = secretsmanager.Secret.fromSecretAttributes(this, "CognitoClientSecret", {
    secretCompleteArn: "arn:aws:secretsmanager:xxx:xxx:secret:xxx-xxx"
}).secretValue

const provider = new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
  clientId: 'amzn-client-id',
  clientSecretValue: secret,
  userPool: userpool,
});
```

Using SAML identity provider is possible to use SAML metadata file content or SAML metadata file url.

```ts
const userpool = new cognito.UserPool(this, 'Pool');

// specify the metadata as a file content
new cognito.UserPoolIdentityProviderSaml(this, 'userpoolIdpFile', {
  userPool: userpool,
  metadata: cognito.UserPoolIdentityProviderSamlMetadata.file('my-file-contents'),
  // Whether to require encrypted SAML assertions from IdP
  encryptedResponses: true,
  // The signing algorithm for the SAML requests
  requestSigningAlgorithm: cognito.SigningAlgorithm.RSA_SHA256,
  // Enable IdP initiated SAML auth flow
  idpInitiated: true,
});

// specify the metadata as a URL
new cognito.UserPoolIdentityProviderSaml(this, 'userpoolidpUrl', {
  userPool: userpool,
  metadata: cognito.UserPoolIdentityProviderSamlMetadata.url('https://my-metadata-url.com'),
});
```

Attribute mapping allows mapping attributes provided by the third-party identity providers to [standard and custom
attributes](#Attributes) of the user pool. Learn more about [Specifying Identity Provider Attribute Mappings for Your
User Pool](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-specifying-attribute-mapping.html).

The following code shows how different attributes provided by 'Login With Amazon' can be mapped to standard and custom
user pool attributes.

```ts
const userpool = new cognito.UserPool(this, 'Pool');

new cognito.UserPoolIdentityProviderAmazon(this, 'Amazon', {
  clientId: 'amzn-client-id',
  clientSecret: 'amzn-client-secret',
  userPool: userpool,
  attributeMapping: {
    email: cognito.ProviderAttribute.AMAZON_EMAIL,
    website: cognito.ProviderAttribute.other('url'), // use other() when an attribute is not pre-defined in the CDK
    custom: {
      // custom user pool attributes go here
      uniqueId: cognito.ProviderAttribute.AMAZON_USER_ID,
    },
  },
});
```

### App Clients

An app is an entity within a user pool that has permission to call unauthenticated APIs (APIs that do not have an
authenticated user), such as APIs to register, sign in, and handle forgotten passwords. To call these APIs, you need an
app client ID and an optional client secret. Read [Configuring a User Pool App
Client](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html) to learn more.

The following code creates an app client and retrieves the client id -

```ts
const pool = new cognito.UserPool(this, 'pool');
const client = pool.addClient('customer-app-client');
const clientId = client.userPoolClientId;
```

Existing app clients can be imported into the CDK app using the `UserPoolClient.fromUserPoolClientId()` API. For new
and imported user pools, clients can also be created via the `UserPoolClient` constructor, as so -

```ts
const importedPool = cognito.UserPool.fromUserPoolId(this, 'imported-pool', 'us-east-1_oiuR12Abd');
new cognito.UserPoolClient(this, 'customer-app-client', {
  userPool: importedPool,
});
```

Clients can be configured with authentication flows. Authentication flows allow users on a client to be authenticated
with a user pool. Cognito user pools provide several different types of authentication, such as, SRP (Secure
Remote Password) authentication, username-and-password authentication, etc. Learn more about this at [UserPool Authentication
Flow](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html).

The following code configures a client to use both SRP and username-and-password authentication -

```ts
const pool = new cognito.UserPool(this, 'pool');
pool.addClient('app-client', {
  authFlows: {
    userPassword: true,
    userSrp: true,
  },
});
```

Custom authentication protocols can be configured by setting the `custom` property under `authFlow` and defining lambda
functions for the corresponding user pool [triggers](#lambda-triggers). Learn more at [Custom Authentication
Flow](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html#amazon-cognito-user-pools-custom-authentication-flow).

Choice-based authentication can be configured by setting the `user` property under `authFlow`. This enables the
`USER_AUTH` authentication flow. Learn more at [Choice-based authentication](https://docs.aws.amazon.com/cognito/latest/developerguide/authentication-flows-selection-sdk.html#authentication-flows-selection-choice).

In addition to these authentication mechanisms, Cognito user pools also support using OAuth 2.0 framework for
authenticating users. User pool clients can be configured with OAuth 2.0 authorization flows and scopes. Learn more
about the [OAuth 2.0 authorization framework](https://tools.ietf.org/html/rfc6749) and [Cognito user pool's
implementation of
OAuth2.0](https://aws.amazon.com/blogs/mobile/understanding-amazon-cognito-user-pool-oauth-2-0-grants/).

The following code configures an app client with the authorization code grant flow and registers the the app's welcome
page as a callback (or redirect) URL. It also configures the access token scope to 'openid'. All of these concepts can
be found in the [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749).

```ts
const pool = new cognito.UserPool(this, 'Pool');
pool.addClient('app-client', {
  oAuth: {
    flows: {
      authorizationCodeGrant: true,
    },
    scopes: [ cognito.OAuthScope.OPENID ],
    callbackUrls: [ 'https://my-app-domain.com/welcome' ],
    logoutUrls: [ 'https://my-app-domain.com/signin' ],
  },
});
```

To set a default redirect URI, use the `defaultRedirectUri` property.
Its value must be present in the `callbackUrls` list.

```ts
const pool = new cognito.UserPool(this, 'Pool');
pool.addClient('app-client', {
  oAuth: {
    flows: {
      authorizationCodeGrant: true,
    },
    scopes: [ cognito.OAuthScope.OPENID ],
    defaultRedirectUri: 'https://my-app-domain.com/welcome',
    callbackUrls: [ 'https://my-app-domain.com/welcome', 'https://my-app-domain.com/hello' ],
    logoutUrls: [ 'https://my-app-domain.com/signin' ],
  },
});
```

An app client can be configured to prevent user existence errors. This
instructs the Cognito authentication API to return generic authentication
failure responses instead of an UserNotFoundException. By default, the flag
is not set, which means the CloudFormation default (false) will be used. See the
[documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-managing-errors.html)
for the full details on the behavior of this flag.

```ts
const pool = new cognito.UserPool(this, 'Pool');
pool.addClient('app-client', {
  preventUserExistenceErrors: true,
});
```

All identity providers created in the CDK app are automatically registered into the corresponding user pool. All app
clients created in the CDK have all of the identity providers enabled by default. The 'Cognito' identity provider,
that allows users to register and sign in directly with the Cognito user pool, is also enabled by default.
Alternatively, the list of supported identity providers for a client can be explicitly specified -

```ts
const pool = new cognito.UserPool(this, 'Pool');
pool.addClient('app-client', {
  // ...
  supportedIdentityProviders: [
    cognito.UserPoolClientIdentityProvider.AMAZON,
    cognito.UserPoolClientIdentityProvider.COGNITO,
  ],
});
```

If the identity provider and the app client are created in the same stack, specify the dependency between both constructs to
make sure that the identity provider already exists when the app client will be created. The app client cannot handle the
dependency to the identity provider automatically because the client does not have access to the provider's construct.

```ts
const pool = new cognito.UserPool(this, 'Pool');
const provider = new cognito.UserPoolIdentityProviderAmazon(this, 'Amazon', {
  userPool: pool,
  clientId: 'amzn-client-id',
  clientSecret: 'amzn-client-secret',
});

const client = pool.addClient('app-client', {
  // ...
  supportedIdentityProviders: [
    cognito.UserPoolClientIdentityProvider.AMAZON,
  ],
});

client.node.addDependency(provider);
```

The property `authSessionValidity` is the session token for each API request in the authentication flow.
Valid duration is from 3 to 15 minutes.

```ts
const pool = new cognito.UserPool(this, 'Pool');
pool.addClient('app-client', {
  // ...
  authSessionValidity: Duration.minutes(15),
});
```

In accordance with the OIDC open standard, Cognito user pool clients provide access tokens, ID tokens and refresh tokens.
More information is available at [Using Tokens with User Pools](https://docs.aws.amazon.com/en_us/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html).
The expiration time for these tokens can be configured as shown below.

```ts
const pool = new cognito.UserPool(this, 'Pool');
pool.addClient('app-client', {
  // ...
  accessTokenValidity: Duration.minutes(60),
  idTokenValidity: Duration.minutes(60),
  refreshTokenValidity: Duration.days(30),
});
```

Clients can (and should) be allowed to read and write relevant user attributes only. Usually every client can be allowed to
read the `given_name` attribute but not every client should be allowed to set the `email_verified` attribute.
The same criteria applies for both standard and custom attributes, more info is available at
[Attribute Permissions and Scopes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html#user-pool-settings-attribute-permissions-and-scopes).
The default behaviour is to allow read and write permissions on all attributes. The following code shows how this can be
configured for a client.

```ts
const pool = new cognito.UserPool(this, 'Pool');

const clientWriteAttributes = (new cognito.ClientAttributes())
  .withStandardAttributes({fullname: true, email: true})
  .withCustomAttributes('favoritePizza', 'favoriteBeverage');

const clientReadAttributes = clientWriteAttributes
  .withStandardAttributes({emailVerified: true})
  .withCustomAttributes('pointsEarned');

pool.addClient('app-client', {
  // ...
  readAttributes: clientReadAttributes,
  writeAttributes: clientWriteAttributes,
});
```

[Token revocation](https://docs.aws.amazon.com/cognito/latest/developerguide/token-revocation.html)
can be configured to be able to revoke refresh tokens in app clients. By default, token revocation is enabled for new user
pools. The property can be used to enable the token revocation in existing app clients or to change the default behavior.

```ts
const pool = new cognito.UserPool(this, 'Pool');
pool.addClient('app-client', {
  // ...
  enableTokenRevocation: true,
});
```

User Pool clients can generate a client ID as well as a client secret, to support more advanced authentication workflows.

To create a client with an autogenerated client secret, pass the `generateSecret: true` prop:

```ts
declare const importedPool: cognito.UserPool;

const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
  userPool: importedPool,
  generateSecret: true,
});

// Allows you to pass the generated secret to other pieces of infrastructure
const secret = userPoolClient.userPoolClientSecret;
```

If you set `enablePropagateAdditionalUserContextData: true`, you can collect and pass
information about your user's session to Amazon Cognito advanced security
when you use the API to sign them up, sign them in, and reset their password.


```ts
declare const importedPool: cognito.UserPool;

const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
  userPool: importedPool,
  generateSecret: true,
  enablePropagateAdditionalUserContextData: true,
});
```

See [Adding user device and session data to API requests](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-adaptive-authentication.html#user-pool-settings-adaptive-authentication-device-fingerprint) for more information.

### Resource Servers

A resource server is a server for access-protected resources. It handles authenticated requests from an app that has an
access token. See [Defining Resource
Servers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-define-resource-servers.html)
for more information.

An application may choose to model custom permissions via OAuth. Resource Servers provide this capability via custom scopes
that are attached to an app client. The following example sets up a resource server for the 'users' resource for two different
app clients and configures the clients to use these scopes.

```ts
const pool = new cognito.UserPool(this, 'Pool');

const readOnlyScope = new cognito.ResourceServerScope({ scopeName: 'read', scopeDescription: 'Read-only access' });
const fullAccessScope = new cognito.ResourceServerScope({ scopeName: '*', scopeDescription: 'Full access' });

const userServer = pool.addResourceServer('ResourceServer', {
  identifier: 'users',
  scopes: [ readOnlyScope, fullAccessScope ],
});

const readOnlyClient = pool.addClient('read-only-client', {
  // ...
  oAuth: {
    // ...
    scopes: [ cognito.OAuthScope.resourceServer(userServer, readOnlyScope) ],
  },
});

const fullAccessClient = pool.addClient('full-access-client', {
  // ...
  oAuth: {
    // ...
    scopes: [ cognito.OAuthScope.resourceServer(userServer, fullAccessScope) ],
  },
});
```

### Domains

After setting up an [app client](#app-clients), the address for the user pool's sign-up and sign-in webpages can be
configured using domains. There are two ways to set up a domain - either the Amazon Cognito hosted domain can be chosen
with an available domain prefix, or a custom domain name can be chosen. The custom domain must be one that is already
owned, and whose certificate is registered in AWS Certificate Manager.

The following code sets up a user pool domain in Amazon Cognito hosted domain with the prefix 'my-awesome-app', and
another domain with the custom domain 'user.myapp.com' -

```ts
const pool = new cognito.UserPool(this, 'Pool');

pool.addDomain('CognitoDomain', {
  cognitoDomain: {
    domainPrefix: 'my-awesome-app',
  },
});

const certificateArn = 'arn:aws:acm:us-east-1:123456789012:certificate/11-3336f1-44483d-adc7-9cd375c5169d';

const domainCert = certificatemanager.Certificate.fromCertificateArn(this, 'domainCert', certificateArn);
pool.addDomain('CustomDomain', {
  customDomain: {
    domainName: 'user.myapp.com',
    certificate: domainCert,
  },
});
```

Read more about [Using the Amazon Cognito
Domain](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-assign-domain-prefix.html) and [Using Your Own
Domain](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html).


You can use the [managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html) page provided by Amazon Cognito to sign in users. The managed login page has two versions: a classic version and a new version. You can switch between the two versions by using the `managedLoginVersion` property.

```ts
const pool = new cognito.UserPool(this, 'Pool');

// Use the new managed login page
pool.addDomain('CognitoDomainWithBlandingDesignManagedLogin', {
  cognitoDomain: {
    domainPrefix: 'blanding-design-ui',
  },
  managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
});

// Use the classic hosted UI
pool.addDomain('DomainWithClassicHostedUi', {
  cognitoDomain: {
    domainPrefix: 'classic-hosted-ui',
  },
  managedLoginVersion: cognito.ManagedLoginVersion.CLASSIC_HOSTED_UI,
});
```

The `signInUrl()` methods returns the fully qualified URL to the login page for the user pool. This page comes from the
hosted UI configured with Cognito. Learn more at [Hosted UI with the Amazon Cognito
Console](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html#cognito-user-pools-create-an-app-integration).

```ts
const userpool = new cognito.UserPool(this, 'UserPool', {
  // ...
});
const client = userpool.addClient('Client', {
  // ...
  oAuth: {
    flows: {
      implicitCodeGrant: true,
    },
    callbackUrls: [
      'https://myapp.com/home',
      'https://myapp.com/users',
    ],
  },
});
const domain = userpool.addDomain('Domain', {
  // ...
});
const signInUrl = domain.signInUrl(client, {
  redirectUri: 'https://myapp.com/home', // must be a URL configured under 'callbackUrls' with the client
});
```

Existing domains can be imported into CDK apps using `UserPoolDomain.fromDomainName()` API

```ts
const myUserPoolDomain = cognito.UserPoolDomain.fromDomainName(this, 'my-user-pool-domain', 'domain-name');
```

To get the domain name of the CloudFront distribution associated with the user pool domain, use `cloudFrontEndpoint` method.

```ts
const userpool = new cognito.UserPool(this, 'UserPool');
const domain = userpool.addDomain('Domain', {
  cognitoDomain: {
    domainPrefix: 'my-awesome-app',
  },
});

new CfnOutput(this, 'CloudFrontEndpoint', {
  value: domain.cloudFrontEndpoint,
});
```

### Deletion protection

Deletion protection can be enabled on a user pool to prevent accidental deletion:

```ts
const userpool = new cognito.UserPool(this, 'UserPool', {
  // ...
  deletionProtection: true,
});
```

By default deletion protection is disabled.

### `email_verified` Attribute Mapping

If you use a third-party identity provider, you can specify the `email_verified` attribute in attributeMapping.

```typescript
const userpool = new cognito.UserPool(this, 'Pool');

new cognito.UserPoolIdentityProviderGoogle(this, 'google', {
  userPool: userpool,
  clientId: 'google-client-id',
  attributeMapping: {
    email: cognito.ProviderAttribute.GOOGLE_EMAIL,
    emailVerified: cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED, // you can mapping the `email_verified` attribute.
  },
});
```

### User Pool Group

Support for groups in Amazon Cognito user pools enables you to create and manage groups and add users to groups.
Use groups to create collections of users to manage their permissions or to represent different types of users.

You can assign an AWS Identity and Access Management (IAM) role to a group to define the permissions for members of a group.

For more information, see [Adding groups to a user pool](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html).

```ts
declare const userPool: cognito.UserPool;
declare const role: iam.Role;

new cognito.UserPoolGroup(this, 'UserPoolGroup', {
  userPool,
  groupName: 'my-group-name',
  precedence: 1,
  role,  // assign IAM Role
});

// You can also add a group by using addGroup method.
userPool.addGroup('AnotherUserPoolGroup', {
  groupName: 'another-group-name'
});
```

### Analytics Configuration

User pool clients can be configured with Amazon Pinpoint analytics to collect user activity metrics. This integration enables you to track user engagement and campaign effectiveness.

📝 Note: Amazon Pinpoint isn't available in all AWS Regions. For a list of available Regions, see [Amazon Cognito and Amazon Pinpoint Region availability](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-pinpoint-integration.html#cognito-user-pools-find-region-mappings).

The following example shows how to configure analytics for a user pool client:

#### When specifying a Pinpoint application from the same account

If you specify the `application` property, do not specify the `applicationId`, `externalId`, or `roleArn` properties.

```ts
import * as pinpoint from 'aws-cdk-lib/aws-pinpoint';

declare const userPool: cognito.UserPool;
declare const pinpointApp: pinpoint.CfnApp;
declare const pinpointRole: iam.Role;

new cognito.UserPoolClient(this, 'Client', {
  userPool,
  analytics: {
    // Your Pinpoint project
    application: pinpointApp,

    // Whether to include user data in analytics events
    shareUserData: true,
  },
});
```

#### When specifying a Pinpoint application from a different account

If you specify the `applicationId`, `externalId`, or `roleArn` properties, do not specify the `application` property.  
(In this case, the `applicationId`, `externalId`, and `roleArn` must all be specified.)

Those three attributes are for the cases when Cognito user pool need to be connected to Pinpoint app in other account.

```ts
import * as pinpoint from 'aws-cdk-lib/aws-pinpoint';

declare const userPool: cognito.UserPool;
declare const pinpointApp: pinpoint.CfnApp;
declare const pinpointRole: iam.Role;

new cognito.UserPoolClient(this, 'Client', {
  userPool,
  analytics: {
    // Your Pinpoint project ID
    applicationId: pinpointApp.ref,

    // External ID for the IAM role
    externalId: "sample-external-id",

    // IAM role that Cognito can assume to publish to Pinpoint
    role: pinpointRole,

    // Whether to include user data in analytics events
    shareUserData: true,
  },
});
```
