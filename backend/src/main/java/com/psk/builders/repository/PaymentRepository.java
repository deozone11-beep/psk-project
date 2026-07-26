package com.psk.builders.repository;
import com.psk.builders.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByOrderByDateDesc();
    List<Payment> findByEmployee_IdOrderByDateDesc(Long employeeId);
}
