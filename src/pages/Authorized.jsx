import React from 'react';
import RenderAuthorized from '@/components/core/Authorized';
import { getAuthority } from '@/utils/authUtils';
import Redirect from 'umi/redirect';

const Authority = getAuthority();
const Authorized = RenderAuthorized(Authority);

export default ({ children }) => (
  <Authorized authority={children.props.route.authority} noMatch={<Redirect to="/auth/login" />}>
    {children}
  </Authorized>
);
