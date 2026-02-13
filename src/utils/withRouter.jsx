import { useParams, useNavigate, useLocation } from "react-router-dom";

/**
 * Higher-Order Component to provide React Router v6 hooks to class components
 * Provides params, navigate, and location as props, mimicking the old withRouter behavior
 */
export function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Create a history-like object for backward compatibility
    const history = {
      push: navigate,
      replace: (path) => navigate(path, { replace: true }),
      go: (n) => navigate(n),
      goBack: () => navigate(-1),
      goForward: () => navigate(1),
      location,
    };

    // Create a match-like object for backward compatibility
    const match = {
      params,
    };

    return (
      <Component
        {...props}
        router={{ navigate, location, params }}
        navigate={navigate}
        location={location}
        params={params}
        match={match}
        history={history}
        {...params}
      />
    );
  }

  return ComponentWithRouterProp;
}

export default withRouter;
