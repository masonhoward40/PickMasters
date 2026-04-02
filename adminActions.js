import * as React from "react";
import { useSession } from "@auth/create/react";

const useUser = () => {
  const { data: session, status } = useSession();
  const id = session?.user?.id;

  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const fetchUser = React.useCallback(async () => {
    if (!id) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(session?.user || null);
      return session?.user || null;
    } finally {
      setLoading(false);
    }
  }, [id, session?.user]);

  const refetchUser = React.useCallback(() => {
    setLoading(true);
    fetchUser();
  }, [fetchUser]);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    data: user,
    loading: status === "loading" || loading,
    refetch: refetchUser,
  };
};

export { useUser };

export default useUser;
