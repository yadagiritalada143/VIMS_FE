import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SvmsTablePaginatorComponent } from './svms-table-paginator.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SvmsTablePaginatorComponent', () => {
  let component: SvmsTablePaginatorComponent;
  let fixture: ComponentFixture<SvmsTablePaginatorComponent>;
  CommonTestingModule.setUpTestBed(SvmsTablePaginatorComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsTablePaginatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
