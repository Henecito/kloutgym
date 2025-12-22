import { createContext, useContext, useState } from "react";
import { supabase } from "../services/supabase";

const ReservationsContext = createContext();

export function ReservationsProvider({ children }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  /**
   * Carga reservas
   * @param clientId
   * @param force boolean -> fuerza recarga
   */
  const loadReservations = async (clientId, force = false) => {
    if (loaded && !force) return; 

    setLoading(true);

    const { data, error } = await supabase
      .from("reservations")
      .select("id, reservation_date, reservation_time, status")
      .eq("client_id", clientId)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (!error) {
      setReservations(data || []);
      setLoaded(true);
    }

    setLoading(false);
  };

  const clearReservations = () => {
    setReservations([]);
    setLoaded(false);
  };

  return (
    <ReservationsContext.Provider
      value={{
        reservations,
        loading,
        loadReservations,
        clearReservations,
      }}
    >
      {children}
    </ReservationsContext.Provider>
  );
}

export const useReservations = () => useContext(ReservationsContext);
