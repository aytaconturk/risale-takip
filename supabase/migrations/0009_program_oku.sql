-- insert ... returning yeni satırı okuma kuralıyla da kontrol eder; program_gorunur()
-- aynı komutta eklenen satırı göremediği için kendi programını oluşturan reddediliyordu.
drop policy program_oku on program;
create policy program_oku on program for select
  using (olusturan_id = auth.uid() or gorunurluk = 'herkes' or program_gorunur(id));
