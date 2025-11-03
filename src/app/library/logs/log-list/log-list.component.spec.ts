import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LogListComponent } from './log-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('LogListComponent', () => {
  let component: LogListComponent;
  let fixture: ComponentFixture<LogListComponent>;
  CommonTestingModule.setUpTestBed(LogListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(LogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
