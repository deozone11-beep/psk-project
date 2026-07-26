package com.psk.builders.repository;
import com.psk.builders.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findAllByOrderByDateDesc();
    List<Attendance> findByEmployee_IdOrderByDateDesc(Long employeeId);
    java.util.Optional<Attendance> findByEmployee_IdAndDate(Long employeeId, java.time.LocalDate date);
}
