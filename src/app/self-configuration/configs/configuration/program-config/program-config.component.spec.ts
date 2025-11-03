import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgramConfigComponent } from './program-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ProgramConfigComponent', () => {
  let component: ProgramConfigComponent;
  let fixture: ComponentFixture<ProgramConfigComponent>;
  CommonTestingModule.setUpTestBed(ProgramConfigComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
