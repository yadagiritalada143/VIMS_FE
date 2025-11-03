import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchNewUiComponent } from './switch-new-ui.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SwitchNewUiComponent', () => {
  let component: SwitchNewUiComponent;
  let fixture: ComponentFixture<SwitchNewUiComponent>;
  CommonTestingModule.setUpTestBed(SwitchNewUiComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchNewUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
